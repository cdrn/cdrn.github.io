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
const SITE = "https://cdrn.xyz/email/";
// every answer a person sees is a redirect to a page on the site
const lands = async (res, page, why) => { assert.equal(res.status, 303, why); assert.equal(res.headers.get("location"), SITE + page, why); };
const sub = (fields) => fetch(W + "/subscribe", { method: "POST", body: new URLSearchParams(fields), redirect: "manual" });

// sign-up
await lands(await sub({ email: "nope" }), "problem/#address");
await lands(await sub({ email: "bot@example.com", website: "x" }), "check/");
assert.equal((await mails()).length, 0, "honeypot and bad address send nothing");
// a failed send must not lock the address out for a day
await fetch(S + "/fail-next");
await lands(await sub({ email: "ada@example.com" }), "problem/#busy");
await lands(await sub({ email: " Ada@Example.com " }), "check/");
await lands(await sub({ email: "ada@example.com" }), "check/");
let m = await mails();
assert.equal(m.length, 1, "one confirm mail despite two sign-ups");
assert.deepEqual(m[0].to, ["ada@example.com"]);
const confirmLink = m[0].html.match(new RegExp(`${W}/confirm\\?t=[0-9a-f]{32}`))[0];

await fetch(S + "/set-feed", { method: "POST", body: feed(old, entry("early", "While pending", new Date().toISOString())) });
await cron();
assert.equal((await mails()).length, 1, "pending subscriber gets no posts");

// opening the mailed link confirms
await lands(await fetch(W + "/confirm?t=" + "0".repeat(32), { redirect: "manual" }), "problem/#link");
await lands(await fetch(confirmLink, { redirect: "manual" }), "confirmed/");
await lands(await fetch(confirmLink, { redirect: "manual" }), "confirmed/", "a second click is harmless");
await cron();
assert.equal((await mails()).length, 1, "nothing released before confirmation is sent");

// a post released after confirmation goes out once
await sub({ email: "pending@example.com" });
await sub({ email: "grace@example.com" });
await fetch((await mails()).filter((x) => x.to[0] === "grace@example.com")[0].html.match(new RegExp(`${W}/confirm\\?t=[0-9a-f]{32}`))[0], { redirect: "manual" });
await sleep(50);
await fetch(S + "/set-feed", { method: "POST", body: feed(old, entry("new", "Moat&#39;s &amp; all", new Date().toISOString())) });
await cron();
await cron();
m = await mails();
const posts = m.filter((x) => x.subject === "Moat's & all").sort((a, b) => a.to[0].localeCompare(b.to[0]));
assert.deepEqual(posts.map((x) => x.to[0]), ["ada@example.com", "grace@example.com"], "new post mailed exactly once, to confirmed subscribers only");
assert.match(posts[0].html, /<p>Fish &amp; chips, it's fine<\/p><p><a href="https:\/\/cdrn\.xyz\/blog\/new\/">Read the post<\/a>/);
assert.match(posts[0].text, /Fish & chips, it's fine\s+https:\/\/cdrn\.xyz\/blog\/new\//);
assert.match(posts[0].idem, /^post-[0-9a-f]{64}$/);
const token = (mail) => mail.html.match(/https:\/\/cdrn\.xyz\/email\/unsubscribe\/#t=([0-9a-f]{32})/)[1];
assert.equal(posts[0].headers["List-Unsubscribe"], `<${W}/unsubscribe?t=${token(posts[0])}>`);

// a GET (mail scanner, or the header address opened in a browser) must not unsubscribe
await lands(await fetch(`${W}/unsubscribe?t=${token(posts[0])}`, { redirect: "manual" }), `unsubscribe/#t=${token(posts[0])}`);
// one-click from a mail client, and the button on the site page
const oneClick = await fetch(`${W}/unsubscribe?t=${token(posts[0])}`, { method: "POST", body: new URLSearchParams({ "List-Unsubscribe": "One-Click" }), redirect: "manual" });
assert.equal(oneClick.status, 200);
await lands(await fetch(`${W}/unsubscribe`, { method: "POST", body: new URLSearchParams({ t: token(posts[1]) }), redirect: "manual" }), "unsubscribed/");
await fetch(S + "/set-feed", { method: "POST", body: feed(old, entry("later", "Later post", new Date().toISOString())) });
await cron();
assert.equal((await mails()).filter((x) => x.subject === "Later post").length, 0, "unsubscribed addresses get nothing");
const left = JSON.parse(execFileSync("npx", ["--yes", "wrangler", "d1", "execute", "DB", "--local", "--json", "--command", "SELECT email, status FROM subscribers ORDER BY email"], { stdio: ["ignore", "pipe", "ignore"] }).toString())[0].results;
assert.deepEqual(left, [{ email: "pending@example.com", status: "pending" }]);

console.log("ok: sign-up, confirm, send-once, unsubscribe");
process.exit(0);
