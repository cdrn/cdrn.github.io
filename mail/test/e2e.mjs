// End-to-end check against `wrangler dev` with a local D1 and test/stub.mjs standing in for
// Resend and the site. Run from mail/: node test/e2e.mjs
import { spawn, execFileSync } from "node:child_process";
import { rmSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";

const W = "http://127.0.0.1:8787", S = "http://127.0.0.1:8799";
const entry = (slug, title, when) => `<entry><title>${title}</title><link href="https://cdrn.xyz/blog/${slug}/"/><published>${when}</published><updated>${when}</updated><id>https://cdrn.xyz/blog/${slug}/</id><content type="html">&lt;p&gt;Fish &amp;amp; chips, it&#39;s fine&lt;/p&gt;&lt;p&gt;&lt;a href=&quot;https://cdrn.xyz/blog/${slug}/&quot;&gt;Read the post&lt;/a&gt;&lt;/p&gt;</content></entry>`;
const feed = (...entries) => `<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom">${entries.join("")}</feed>`;
const old = entry("old", "Old post", "2026-09-01T00:17:29Z");

rmSync(".wrangler", { recursive: true, force: true });
writeFileSync(".dev.vars", `RESEND_API_KEY=test\nRESEND_URL=${S}\nFEED_URL=${S}/feed.xml\nPUBLIC_URL=${W}\n`);
writeFileSync("test/feed.tmp.xml", feed(old));
execFileSync("npx", ["--yes", "wrangler", "d1", "execute", "DB", "--local", "--file", "schema.sql"], { stdio: "ignore" });
const procs = [
	spawn("node", ["test/stub.mjs", "test/feed.tmp.xml"], { stdio: "inherit" }),
	spawn("npx", ["--yes", "wrangler", "dev", "--local", "--test-scheduled", "--port", "8787"], { stdio: "ignore" }),
];
const stop = () => { procs.forEach((p) => p.kill()); rmSync("test/feed.tmp.xml", { force: true }); };
process.on("exit", stop);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
for (let i = 0; ; i++) {
	try { await fetch(W + "/nope"); break; } catch { if (i > 60) throw new Error("wrangler dev did not start"); await sleep(500); }
}
const mails = async () => (await fetch(S + "/mails")).json();
const cron = async () => { assert.equal((await fetch(W + "/__scheduled")).status, 200); await sleep(700); };
const sub = (fields) => fetch(W + "/subscribe", { method: "POST", body: new URLSearchParams(fields) });
const linkIn = (mail, kind) => mail.html.match(new RegExp(`${W}/${kind}\\?t=[0-9a-f]{32}`))[0];

// sign-up
assert.equal((await sub({ email: "nope" })).status, 400);
assert.equal((await sub({ email: "bot@example.com", website: "x" })).status, 200);
assert.equal((await mails()).length, 0, "honeypot and bad address send nothing");
// a failed send must not lock the address out for a day
await fetch(S + "/fail-next");
assert.equal((await sub({ email: "ada@example.com" })).status, 500);
assert.equal((await sub({ email: " Ada@Example.com " })).status, 200);
assert.equal((await sub({ email: "ada@example.com" })).status, 200);
let m = await mails();
assert.equal(m.length, 1, "one confirm mail despite two sign-ups");
assert.deepEqual(m[0].to, ["ada@example.com"]);
const confirmLink = linkIn(m[0], "confirm");

// a GET (mail scanner) must not confirm
assert.equal((await fetch(confirmLink)).status, 200);
await fetch(S + "/set-feed", { method: "POST", body: feed(old, entry("scan", "While pending", new Date().toISOString())) });
await cron();
assert.equal((await mails()).length, 1, "pending subscriber gets no posts");

assert.equal((await fetch(confirmLink, { method: "POST" })).status, 200);
assert.equal((await fetch(W + "/confirm?t=" + "0".repeat(32), { method: "POST" })).status, 400);
await cron();
assert.equal((await mails()).length, 1, "nothing released before confirmation is sent");

// a post released after confirmation goes out once
await sub({ email: "pending@example.com" });
await sleep(50);
await fetch(S + "/set-feed", { method: "POST", body: feed(old, entry("new", "Moat&#39;s &amp; all", new Date().toISOString())) });
await cron();
await cron();
m = await mails();
const posts = m.filter((x) => x.subject === "Moat's & all");
assert.equal(posts.length, 1, "new post mailed exactly once, to the confirmed subscriber only");
assert.deepEqual(posts[0].to, ["ada@example.com"]);
assert.match(posts[0].html, /<p>Fish &amp; chips, it's fine<\/p><p><a href="https:\/\/cdrn\.xyz\/blog\/new\/">Read the post<\/a>/);
assert.match(posts[0].text, /Fish & chips, it's fine\s+https:\/\/cdrn\.xyz\/blog\/new\//);
assert.match(posts[0].idem, /^post-[0-9a-f]{64}$/);
const unsub = linkIn(posts[0], "unsubscribe");
assert.equal(posts[0].headers["List-Unsubscribe"], `<${unsub}>`);

// one-click unsubscribe deletes the address
assert.equal((await fetch(unsub, { method: "POST", body: new URLSearchParams({ "List-Unsubscribe": "One-Click" }) })).status, 200);
await fetch(S + "/set-feed", { method: "POST", body: feed(old, entry("later", "Later post", new Date().toISOString())) });
await cron();
assert.equal((await mails()).filter((x) => x.subject === "Later post").length, 0, "unsubscribed address gets nothing");
const left = JSON.parse(execFileSync("npx", ["--yes", "wrangler", "d1", "execute", "DB", "--local", "--json", "--command", "SELECT email, status FROM subscribers ORDER BY email"], { stdio: ["ignore", "pipe", "ignore"] }).toString())[0].results;
assert.deepEqual(left, [{ email: "pending@example.com", status: "pending" }]);

console.log("ok: sign-up, confirm, send-once, unsubscribe");
process.exit(0);
