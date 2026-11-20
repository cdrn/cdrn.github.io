// Mailing list for cdrn.xyz.
//
//   POST /subscribe     the form on the site; stores the address as pending and mails a confirm link
//   GET/POST /confirm   the link shows a button, the button confirms (so mail scanners can't confirm for you)
//   GET/POST /unsubscribe  same shape; POST also serves one-click List-Unsubscribe
//   cron                reads FEED_URL and mails each entry to everyone who confirmed before it was released
//
// The feed decides what goes out and when (attested posts, a day after signing - see emailFeed in
// eleventy.config.js). There is no "sent" flag per post: a subscriber is owed an entry if it was
// released after they confirmed and there is no deliveries row for it.

const CONFIRM_COOLDOWN_MS = 24 * 3600 * 1000; // one confirm mail per address per day
const CONFIRM_HOURLY_CAP = 30; // across all addresses, so the form can't be used to spray mail
const BATCH = 100; // Resend's batch limit

export default {
	async fetch(request, env) {
		const url = new URL(request.url);
		const route = `${request.method} ${url.pathname}`;
		try {
			if (route === "POST /subscribe") return await subscribe(request, env);
			if (route === "GET /confirm") return tokenPage(url, env, "confirm");
			if (route === "POST /confirm") return await confirm(url, env);
			if (route === "GET /unsubscribe") return tokenPage(url, env, "unsubscribe");
			if (route === "POST /unsubscribe") return await unsubscribe(url, env);
			if (route === "GET /") return Response.redirect(env.SITE_URL, 302);
			return page(env, "Not found", "<p>Nothing here.</p>", 404);
		} catch (err) {
			console.error(err);
			return page(env, "Something went wrong", "<p>That didn't work. Try again in a bit.</p>", 500);
		}
	},

	async scheduled(event, env, ctx) {
		ctx.waitUntil(sendNewPosts(env));
	},
};

async function subscribe(request, env) {
	const form = await request.formData();
	const email = String(form.get("email") || "").trim().toLowerCase();
	// The same answer whatever happens next, so the form can't be used to probe who is on the list
	const done = () => page(env, "Check your inbox", `<p>If that address isn't already subscribed, a confirmation link is on its way. Nothing is sent to you until you click it.</p>`);

	if (form.get("website")) return done(); // honeypot field, hidden from people
	if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
		return page(env, "That doesn't look right", "<p>That doesn't look like an email address. Go back and try again.</p>", 400);
	}

	const now = Date.now();
	const existing = await env.DB.prepare("SELECT token, status, confirm_sent_at FROM subscribers WHERE email = ?").bind(email).first();
	if (existing && (existing.status === "confirmed" || now - existing.confirm_sent_at < CONFIRM_COOLDOWN_MS)) return done();

	const recent = await env.DB.prepare("SELECT COUNT(*) AS n FROM subscribers WHERE confirm_sent_at > ?").bind(now - 3600 * 1000).first();
	if (recent.n >= CONFIRM_HOURLY_CAP) {
		return page(env, "Try again later", "<p>Too many sign-ups in the last hour. Try again later.</p>", 429);
	}

	const token = existing ? existing.token : newToken();
	await env.DB.prepare(
		`INSERT INTO subscribers (email, token, status, created_at, confirm_sent_at) VALUES (?, ?, 'pending', ?, ?)
		 ON CONFLICT (email) DO UPDATE SET confirm_sent_at = excluded.confirm_sent_at`
	).bind(email, token, now, now).run();

	const link = `${env.PUBLIC_URL}/confirm?t=${token}`;
	await sendConfirm(env, email, link).catch(async (err) => {
		// Don't leave the address in its cooldown if the mail never went out
		await env.DB.prepare("UPDATE subscribers SET confirm_sent_at = 0 WHERE email = ?").bind(email).run();
		throw err;
	});
	return done();
}

function sendConfirm(env, email, link) {
	return resend(env, "/emails", {
		from: env.MAIL_FROM,
		to: [email],
		subject: "Confirm your subscription to cdrn.xyz",
		html: `<p>Someone, hopefully you, asked to get new posts from <a href="${env.SITE_URL}">cdrn.xyz</a> by email.</p><p><a href="${link}">Confirm the subscription</a></p><p>If that wasn't you, ignore this and you won't hear from me again.</p>`,
		text: `Someone, hopefully you, asked to get new posts from cdrn.xyz by email.\n\nConfirm the subscription: ${link}\n\nIf that wasn't you, ignore this and you won't hear from me again.`,
	});
}

// GET on a mailed link only shows a button; the button's POST does the thing
function tokenPage(url, env, action) {
	const token = url.searchParams.get("t") || "";
	if (!/^[0-9a-f]{32}$/.test(token)) return page(env, "Link not recognised", "<p>That link is incomplete or has expired.</p>", 400);
	const copy = action === "confirm"
		? ["Confirm your subscription", "One email per post, about a day after it goes up.", "Confirm"]
		: ["Unsubscribe", "You'll stop getting new posts by email.", "Unsubscribe"];
	return page(env, copy[0], `<p>${copy[1]}</p><form method="post" action="/${action}?t=${token}"><button type="submit">${copy[2]}</button></form>`);
}

async function confirm(url, env) {
	const token = url.searchParams.get("t") || "";
	const res = await env.DB.prepare("UPDATE subscribers SET status = 'confirmed', confirmed_at = COALESCE(confirmed_at, ?) WHERE token = ?").bind(Date.now(), token).run();
	if (!res.meta.changes) return page(env, "Link not recognised", "<p>That link is incomplete or has expired.</p>", 400);
	return page(env, "You're subscribed", "<p>You'll get an email when the next post goes up.</p>");
}

async function unsubscribe(url, env) {
	const token = url.searchParams.get("t") || "";
	const row = await env.DB.prepare("SELECT email FROM subscribers WHERE token = ?").bind(token).first();
	if (row) {
		await env.DB.batch([
			env.DB.prepare("DELETE FROM deliveries WHERE email = ?").bind(row.email),
			env.DB.prepare("DELETE FROM subscribers WHERE email = ?").bind(row.email),
		]);
	}
	// Same answer for an unknown token: an unsubscribe link should never look broken
	return page(env, "Unsubscribed", "<p>Your address has been deleted from the list.</p>");
}

async function sendNewPosts(env) {
	const res = await fetch(env.FEED_URL, { headers: { "cache-control": "no-cache" } });
	if (!res.ok) throw new Error(`feed ${res.status}`);
	const entries = parseFeed(await res.text()).sort((a, b) => a.published - b.published);

	for (const entry of entries) {
		for (;;) {
			const { results } = await env.DB.prepare(
				`SELECT s.email, s.token FROM subscribers s
				 WHERE s.status = 'confirmed' AND s.confirmed_at < ?
				   AND NOT EXISTS (SELECT 1 FROM deliveries d WHERE d.post_id = ? AND d.email = s.email)
				 ORDER BY s.email LIMIT ?`
			).bind(entry.published, entry.id, BATCH).all();
			if (!results.length) break;

			const mails = results.map((sub) => {
				const unsub = `${env.PUBLIC_URL}/unsubscribe?t=${sub.token}`;
				return {
					from: env.MAIL_FROM,
					to: [sub.email],
					subject: entry.title,
					html: `${entry.html}<hr><p style="font-size:12px;color:#6b6b66">You subscribed at <a href="${env.SITE_URL}">cdrn.xyz</a>. <a href="${unsub}">Unsubscribe</a></p>`,
					text: `${entry.title}\n\n${entry.text}\n\n${entry.url}\n\n--\nYou subscribed at cdrn.xyz. Unsubscribe: ${unsub}`,
					headers: { "List-Unsubscribe": `<${unsub}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
				};
			});
			// If the insert below fails after a successful send, the retry carries the same key and Resend drops it
			const key = await sha256(entry.id + "\n" + results.map((s) => s.email).join("\n"));
			await resend(env, "/emails/batch", mails, { "Idempotency-Key": `post-${key}` });

			const now = Date.now();
			await env.DB.batch(results.map((sub) =>
				env.DB.prepare("INSERT OR IGNORE INTO deliveries (post_id, email, sent_at) VALUES (?, ?, ?)").bind(entry.id, sub.email, now)
			));
			console.log(`sent "${entry.title}" to ${results.length}`);
		}
	}
}

// Only ever reads our own /feed/email.xml, so a few regexes over its known shape are enough
export function parseFeed(xml) {
	const unescape = (s) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
	const entries = [];
	for (const [, body] of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
		const pick = (re) => (body.match(re) || [])[1];
		const id = pick(/<id>([^<]+)<\/id>/);
		const published = Date.parse(pick(/<published>([^<]+)<\/published>/));
		if (!id || Number.isNaN(published)) continue;
		const html = unescape(pick(/<content type="html">([\s\S]*?)<\/content>/) || "");
		entries.push({
			id,
			published,
			url: pick(/<link href="([^"]+)"/) || id,
			title: unescape(pick(/<title>([^<]*)<\/title>/) || "New post"),
			html,
			text: unescape(html.replace(/<a\b[^>]*>[\s\S]*?<\/a>/g, "").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim(),
		});
	}
	return entries;
}

async function resend(env, path, body, headers = {}) {
	const res = await fetch((env.RESEND_URL || "https://api.resend.com") + path, {
		method: "POST",
		headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json", ...headers },
		body: JSON.stringify(body),
	});
	if (!res.ok) throw new Error(`resend ${path} ${res.status}: ${(await res.text()).slice(0, 300)}`);
}

function newToken() {
	return [...crypto.getRandomValues(new Uint8Array(16))].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256(s) {
	const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
	return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function page(env, title, body, status = 200) {
	return new Response(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex">
<title>${title}</title>
<style>
:root { --bg: #fdfcf8; --ink: #2b2926; --muted: #6b6b66; --link: #1a5296; --rule: #ddd9d0; }
@media (prefers-color-scheme: dark) { :root { --bg: #191a1e; --ink: #ddd9d0; --muted: #96938c; --link: #8fb6e8; --rule: #34363c; } }
body { margin: 0; padding: 4em 16px; background: var(--bg); color: var(--ink); font: 18px/1.7 Palatino, "Palatino Linotype", "Book Antiqua", Georgia, serif; }
main { max-width: 36em; margin: 0 auto; }
h1 { font-size: 1.6em; line-height: 1.25; margin: 0 0 0.6em; }
a { color: var(--link); }
button { font: inherit; padding: 0.3em 0.9em; border: 1px solid var(--rule); border-radius: 4px; background: transparent; color: var(--ink); cursor: pointer; }
footer { margin-top: 3em; padding-top: 1em; border-top: 1px solid var(--rule); font-size: 0.9em; color: var(--muted); }
</style>
</head>
<body>
<main>
<h1>${title}</h1>
${body}
<footer><a href="${env.SITE_URL}">Back to cdrn.xyz</a></footer>
</main>
</body>
</html>`, { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "referrer-policy": "no-referrer" } });
}
