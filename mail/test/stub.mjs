// Local stand-in for Resend and the site: records every mail it's asked to send
// and serves a feed that can be swapped at runtime. Used by test/e2e.sh.
import { createServer } from "node:http";
import { readFileSync } from "node:fs";

const mails = [];
let failNext = false;
let feed = readFileSync(process.argv[2], "utf8");

createServer((req, res) => {
	let body = "";
	req.on("data", (c) => (body += c));
	req.on("end", () => {
		if (req.url === "/feed.xml") return res.end(feed);
		if (req.url === "/set-feed") { feed = body; return res.end("ok"); }
		if (req.url === "/mails") return res.end(JSON.stringify(mails));
		if (req.url === "/fail-next") { failNext = true; return res.end("ok"); }
		if (failNext && req.url.startsWith("/emails")) { failNext = false; res.statusCode = 500; return res.end("down"); }
		if (req.url === "/emails" || req.url === "/emails/batch") {
			const sent = JSON.parse(body);
			for (const m of Array.isArray(sent) ? sent : [sent]) mails.push({ ...m, idem: req.headers["idempotency-key"] || null });
			return res.end(JSON.stringify({ data: [] }));
		}
		res.statusCode = 404; res.end();
	});
}).listen(8799, "127.0.0.1");
