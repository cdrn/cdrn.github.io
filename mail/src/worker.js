// Mailing list for cdrn.xyz.
//
//   POST /subscribe     the form on the site; stores the address as pending and mails a confirm link
//   GET  /confirm       the mailed link; confirms straight away
//   POST /unsubscribe   the button on the site's /email/unsubscribe/ page, and one-click List-Unsubscribe
//   cron                reads FEED_URL and mails each entry to everyone who confirmed before it was released
//
// This Worker has no pages of its own. Every answer a person sees is a redirect to a page under
// SITE_URL/email/, so it renders like the rest of the site, in the reader's theme.
//
// The feed decides what goes out and when (attested posts, a day after signing - see emailFeed in
// eleventy.config.js). There is no "sent" flag per post: a subscriber is owed an entry if it was
// released after they confirmed and there is no deliveries row for it.

const CONFIRM_COOLDOWN_MS = 24 * 3600 * 1000; // one confirm mail per address per day
const CONFIRM_HOURLY_CAP = 30; // across all addresses, so the form can't be used to spray mail
const BATCH = 100; // Resend's batch limit
const TOKEN = /^[0-9a-f]{32}$/;

export default {
	async fetch(request, env) {
		const url = new URL(request.url);
		const route = `${request.method} ${url.pathname}`;
		try {
			if (route === "POST /subscribe") return await subscribe(request, env);
			if (route === "GET /confirm") return await confirm(url, env);
			if (route === "POST /unsubscribe") return await unsubscribe(request, url, env);
			// The List-Unsubscribe address opened in a browser: hand over to the page with the button
			if (route === "GET /unsubscribe") return to(env, `unsubscribe/#t=${url.searchParams.get("t") || ""}`);
			if (route === "GET /") return Response.redirect(env.SITE_URL, 302);
			return new Response("Not found\n", { status: 404 });
		} catch (err) {
			console.error(err);
			return to(env, "problem/#busy");
		}
	},

	async scheduled(event, env, ctx) {
		ctx.waitUntil(sendNewPosts(env));
	},
};

// 303 so a form POST lands on the site page as a GET
function to(env, page) {
	return new Response(null, { status: 303, headers: { location: `${env.SITE_URL}/email/${page}`, "cache-control": "no-store" } });
}

async function subscribe(request, env) {
	const form = await request.formData();
	const email = String(form.get("email") || "").trim().toLowerCase();
	// The same answer whatever happens next, so the form can't be used to probe who is on the list
	const done = () => to(env, "check/");

	if (form.get("website")) return done(); // honeypot field, hidden from people
	if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return to(env, "problem/#address");

	const now = Date.now();
	const existing = await env.DB.prepare("SELECT token, status, confirm_sent_at FROM subscribers WHERE email = ?").bind(email).first();
	if (existing && (existing.status === "confirmed" || now - existing.confirm_sent_at < CONFIRM_COOLDOWN_MS)) return done();

	const recent = await env.DB.prepare("SELECT COUNT(*) AS n FROM subscribers WHERE confirm_sent_at > ?").bind(now - 3600 * 1000).first();
	if (recent.n >= CONFIRM_HOURLY_CAP) return to(env, "problem/#busy");

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

// Opening the mailed link is the confirmation. A mail scanner that follows links can confirm an
// address too; the cost is that address getting post emails it can unsubscribe from.
async function confirm(url, env) {
	const token = url.searchParams.get("t") || "";
	if (!TOKEN.test(token)) return to(env, "problem/#link");
	const res = await env.DB.prepare("UPDATE subscribers SET status = 'confirmed', confirmed_at = COALESCE(confirmed_at, ?) WHERE token = ?").bind(Date.now(), token).run();
	return to(env, res.meta.changes ? "confirmed/" : "problem/#link");
}

// Unsubscribing stays a POST: a scanner following links must not be able to take someone off the list
async function unsubscribe(request, url, env) {
	const form = await request.formData().catch(() => new FormData());
	const token = String(form.get("t") || url.searchParams.get("t") || "");
	const row = TOKEN.test(token) && await env.DB.prepare("SELECT email FROM subscribers WHERE token = ?").bind(token).first();
	if (row) {
		await env.DB.batch([
			env.DB.prepare("DELETE FROM deliveries WHERE email = ?").bind(row.email),
			env.DB.prepare("DELETE FROM subscribers WHERE email = ?").bind(row.email),
		]);
	}
	// A mail client's one-click request wants a plain answer, a person wants the page. Same answer
	// for an unknown token either way: an unsubscribe link should never look broken.
	if (form.get("List-Unsubscribe")) return new Response("Unsubscribed\n");
	return to(env, "unsubscribed/");
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
				const oneClick = `${env.PUBLIC_URL}/unsubscribe?t=${sub.token}`;
				const unsub = `${env.SITE_URL}/email/unsubscribe/#t=${sub.token}`;
				return {
					from: env.MAIL_FROM,
					to: [sub.email],
					subject: entry.title,
					html: `${entry.html}<hr><p style="font-size:12px;color:#6b6b66">You subscribed at <a href="${env.SITE_URL}">cdrn.xyz</a>. <a href="${unsub}">Unsubscribe</a></p>`,
					text: `${entry.title}\n\n${entry.text}\n\n${entry.url}\n\n--\nYou subscribed at cdrn.xyz. Unsubscribe: ${unsub}`,
					headers: { "List-Unsubscribe": `<${oneClick}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
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
