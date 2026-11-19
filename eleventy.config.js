const { DateTime } = require("luxon");
const markdownItAnchor = require("markdown-it-anchor");
const markdownItFootnote = require("markdown-it-footnote");

const pluginRss = require("@11ty/eleventy-plugin-rss");
const pluginSyntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const pluginBundle = require("@11ty/eleventy-plugin-bundle");
const pluginNavigation = require("@11ty/eleventy-navigation");
const { EleventyHtmlBasePlugin } = require("@11ty/eleventy");

const pluginDrafts = require("./eleventy.config.drafts.js");
const pluginImages = require("./eleventy.config.images.js");

module.exports = function(eleventyConfig) {
	// Add reading time filter (move this up, before other template configurations)
	eleventyConfig.addFilter("readingTime", function(content) {
		if (!content) {
			return 0;
		}
		// Strip <script> and <style> blocks — they're inline UI/code, not prose —
		// then tags and entities, so markup doesn't count as words.
		const stripped = content.toString()
			.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
			.replace(/<[^>]+>/g, " ")
			.replace(/&[a-z#0-9]+;/gi, " ");
		const wordsPerMinute = 230;
		const words = stripped.trim().split(/\s+/).filter(Boolean).length;
		const minutes = Math.ceil(words / wordsPerMinute);
		return minutes;
	});

	// Extract h2/h3 headings into a nested table of contents
	eleventyConfig.addFilter("toc", function(content) {
		if (!content) return "";
		const headingRe = /<h([23])\b[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/g;
		const stripAnchor = /<a\b[^>]*class="header-anchor"[\s\S]*?<\/a>/g;
		const stripTags = /<[^>]+>/g;
		const items = [];
		let match;
		while ((match = headingRe.exec(content)) !== null) {
			const level = parseInt(match[1], 10);
			const id = match[2];
			const text = match[3].replace(stripAnchor, "").replace(stripTags, "").trim();
			items.push({ level, id, text });
		}
		if (items.length < 3) return "";
		const minLevel = Math.min(...items.map(i => i.level));
		let html = '<details class="toc"><summary>Contents</summary><ol>';
		let depth = 0;
		items.forEach(({ level, id, text }, i) => {
			const target = level - minLevel;
			if (i === 0) {
				html += `<li><a href="#${id}">${text}</a>`;
			} else if (target > depth) {
				html += "<ol><li>".repeat(target - depth - 1) + `<ol><li><a href="#${id}">${text}</a>`;
			} else if (target < depth) {
				html += `</li>` + `</ol></li>`.repeat(depth - target) + `<li><a href="#${id}">${text}</a>`;
			} else {
				html += `</li><li><a href="#${id}">${text}</a>`;
			}
			depth = target;
		});
		html += `</li>` + `</ol></li>`.repeat(depth) + "</ol></details>";
		return html;
	});

	// Copy the contents of the `public` folder to the output folder
	// For example, `./public/css/` ends up in `_site/css/`
	eleventyConfig.addPassthroughCopy({
		"./public/": "/",
		"./node_modules/prismjs/themes/prism-okaidia.css": "/css/prism-okaidia.css"
	});

	// Copy content images alongside posts
	eleventyConfig.addPassthroughCopy("content/**/*.{svg,webp,png,jpeg,jpg,gif}");

	// Copy provenance artefacts alongside posts. provenance/ dirs hold archived
	// attested revisions (pre-image + ots + statement per revision) - publish
	// them verbatim, never render them as pages.
	eleventyConfig.addPassthroughCopy("content/**/*.{ots,txt}");
	eleventyConfig.addPassthroughCopy("content/**/provenance/*.md");
	eleventyConfig.ignores.add("content/**/provenance/**");
	// Stray build output (e.g. a build run from inside a post folder) must never become pages
	eleventyConfig.ignores.add("content/**/_site/**");

	// Publish the markdown source of attested posts, so the sha256 in each
	// attestation resolves to fetchable bytes at the post's own URL. Only
	// attested dirs are copied - drafts stay unpublished.
	{
		const fs = require("fs");
		const path = require("path");
		const blogDir = "content/blog";
		for (const entry of fs.readdirSync(blogDir, { withFileTypes: true })) {
			if (!entry.isDirectory()) continue;
			const postDir = path.join(blogDir, entry.name);
			if (!fs.existsSync(path.join(postDir, "attestation.txt"))) continue;
			for (const f of fs.readdirSync(postDir)) {
				if (f.endsWith(".md")) {
					eleventyConfig.addPassthroughCopy({ [path.join(postDir, f)]: path.join("blog", entry.name, f) });
				}
			}
		}
	}

	// Run Eleventy when these files change:
	// https://www.11ty.dev/docs/watch-serve/#add-your-own-watch-targets

	// Watch content images for the image pipeline.
	eleventyConfig.addWatchTarget("content/**/*.{svg,webp,png,jpeg}");

	// App plugins
	eleventyConfig.addPlugin(pluginDrafts);
	eleventyConfig.addPlugin(pluginImages);

	// Official plugins
	eleventyConfig.addPlugin(pluginRss);
	eleventyConfig.addPlugin(pluginSyntaxHighlight, {
		preAttributes: { tabindex: 0 }
	});
	eleventyConfig.addPlugin(pluginNavigation);
	eleventyConfig.addPlugin(EleventyHtmlBasePlugin);
	eleventyConfig.addPlugin(pluginBundle);

	// Filters
	eleventyConfig.addFilter("readableDate", (dateObj, format, zone) => {
		// Formatting tokens for Luxon: https://moment.github.io/luxon/#/formatting?id=table-of-tokens
		return DateTime.fromJSDate(dateObj, { zone: zone || "utc" }).toFormat(format || "dd LLLL yyyy");
	});

	eleventyConfig.addFilter('htmlDateString', (dateObj) => {
		// dateObj input: https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#valid-date-string
		return DateTime.fromJSDate(dateObj, {zone: 'utc'}).toFormat('yyyy-LL-dd');
	});

	// Provenance: parse a post's attestation.txt (if present) for the footer line
	eleventyConfig.addFilter("attestation", (inputPath) => {
		const fs = require("fs");
		const path = require("path");
		const dir = path.dirname(inputPath);
		const attPath = path.join(dir, "attestation.txt");
		if (!fs.existsSync(attPath)) return null;
		const txt = fs.readFileSync(attPath, "utf8");
		const hashMatch = txt.match(/sha256:\s*([0-9a-f]{64})/);
		if (!hashMatch) return null;
		const ots = fs.readdirSync(dir).find((f) => f.endsWith(".ots")) || null;
		return { hash: hashMatch[1], hashShort: hashMatch[1].slice(0, 8), ots, src: path.basename(inputPath) };
	});

	// Email feed: posts that are attested and past the send delay, oldest first.
	// A post is released `delayHours` after the later of its first attestation
	// commit and its frontmatter date, so nothing is mailed while it's still
	// being tightened. Release times come from git, not the build clock, so the
	// feed only changes when a post crosses the line.
	const attestedAtCache = new Map();
	const attestedAt = (attPath) => {
		if (attestedAtCache.has(attPath)) return attestedAtCache.get(attPath);
		const { execFileSync } = require("child_process");
		const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim();
		// A shallow clone reports every file as added in its root commit, which
		// would pull long-sent posts out of the feed and re-release them.
		if (git("rev-parse", "--is-shallow-repository") === "true") {
			throw new Error("email feed needs full git history (checkout with fetch-depth: 0)");
		}
		const first = git("log", "--diff-filter=A", "--format=%ct", "--", attPath).split("\n").pop();
		const when = first ? new Date(Number(first) * 1000) : null; // null: attestation not committed yet
		attestedAtCache.set(attPath, when);
		return when;
	};
	eleventyConfig.addFilter("emailFeed", (posts, delayHours, baseUrl) => {
		const fs = require("fs");
		const path = require("path");
		const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
		const now = Date.now();
		const out = [];
		for (const post of posts || []) {
			const attPath = path.join(path.dirname(post.inputPath), "attestation.txt");
			if (!fs.existsSync(attPath)) continue;
			const signed = attestedAt(attPath);
			if (!signed) continue;
			const released = new Date(Math.max(signed.getTime(), post.date.getTime()) + delayHours * 3600 * 1000);
			if (released.getTime() > now) continue;
			const url = baseUrl + post.url;
			const html = (post.data.description ? `<p>${esc(post.data.description)}</p>` : "")
				+ `<p><a href="${esc(url)}">Read the post</a></p>`;
			out.push({ title: post.data.title, url, released, html });
		}
		return out.sort((a, b) => a.released - b.released);
	});

	// First image in rendered content as an absolute URL, for og:image cards
	eleventyConfig.addFilter("firstImage", (content, baseUrl, pageUrl) => {
		if (typeof content !== "string") return null;
		let match = content.match(/<img[^>]+src="([^"]+)"/);
		if (!match) return null;
		let src = match[1];
		if (/^https?:\/\//.test(src)) return src;
		if (src.startsWith("/")) return baseUrl + src;
		return baseUrl + pageUrl + src;
	});

	// Get the first `n` elements of a collection.
	eleventyConfig.addFilter("head", (array, n) => {
		if(!Array.isArray(array) || array.length === 0) {
			return [];
		}
		if( n < 0 ) {
			return array.slice(n);
		}

		return array.slice(0, n);
	});

	// Return the smallest number argument
	eleventyConfig.addFilter("min", (...numbers) => {
		return Math.min.apply(null, numbers);
	});

	// Return all the tags used in a collection
	eleventyConfig.addFilter("getAllTags", collection => {
		let tagSet = new Set();
		for(let item of collection) {
			(item.data.tags || []).forEach(tag => tagSet.add(tag));
		}
		return Array.from(tagSet);
	});

	eleventyConfig.addFilter("filterTagList", function filterTagList(tags) {
		return (tags || []).filter(tag => ["all", "nav", "post", "posts"].indexOf(tag) === -1);
	});

	// Tags across a collection sorted by frequency (descending), then alphabetical
	eleventyConfig.addFilter("tagsByCount", function(collection) {
		const counts = new Map();
		for (const item of collection) {
			for (const tag of (item.data.tags || [])) {
				if (["all", "nav", "post", "posts"].includes(tag)) continue;
				counts.set(tag, (counts.get(tag) || 0) + 1);
			}
		}
		return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
	});

	// Customize Markdown library settings:
	eleventyConfig.amendLibrary("md", mdLib => {
		mdLib.use(markdownItAnchor, {
			permalink: markdownItAnchor.permalink.ariaHidden({
				placement: "after",
				class: "header-anchor",
				symbol: "#",
				ariaHidden: false,
			}),
			level: [1,2,3,4],
			slugify: eleventyConfig.getFilter("slugify"),
			linkify: true,
		});
		mdLib.use(markdownItFootnote);
		// Drop the [brackets] around the superscript marker (default is "[1]")
		mdLib.renderer.rules.footnote_caption = (tokens, idx) => {
			let n = Number(tokens[idx].meta.id + 1).toString();
			if (tokens[idx].meta.subId > 0) n += `:${tokens[idx].meta.subId}`;
			return n;
		};
	});

	// Features to make your build faster (when you need them)

	// If your passthrough copy gets heavy and cumbersome, add this line
	// to emulate the file copy on the dev server. Learn more:
	// https://www.11ty.dev/docs/copy/#emulate-passthrough-copy-during-serve

	// eleventyConfig.setServerPassthroughCopyBehavior("passthrough");

	return {
		// Control which files Eleventy will process
		// e.g.: *.md, *.njk, *.html, *.liquid
		templateFormats: [
			"md",
			"njk",
			"html",
			"liquid",
		],

		// Pre-process *.md files with: (default: `liquid`)
		markdownTemplateEngine: "njk",

		// Pre-process *.html files with: (default: `liquid`)
		htmlTemplateEngine: "njk",

		// These are all optional:
		dir: {
			input: "content",          // default: "."
			includes: "../_includes",  // default: "_includes"
			data: "../_data",          // default: "_data"
			output: "_site"
		},

		// -----------------------------------------------------------------
		// Optional items:
		// -----------------------------------------------------------------

		// If your site deploys to a subdirectory, change `pathPrefix`.
		// Read more: https://www.11ty.dev/docs/config/#deploy-to-a-subdirectory-with-a-path-prefix

		// When paired with the HTML <base> plugin https://www.11ty.dev/docs/plugins/html-base/
		// it will transform any absolute URLs in your HTML to include this
		// folder name and does **not** affect where things go in the output folder.
		pathPrefix: "/",
	};
};
