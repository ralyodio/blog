#!/usr/bin/env node
// Rebuilds feed.xml from the post files in this directory.
// Keeps the 10 most recent posts. Run: node build-feed.mjs
//
// Each post needs, in its <head>:
//   <meta name="date" content="2026-08-14T11:21:00Z">
//   <meta name="description" content="one-line summary for the feed">
// Title comes from <h1>, falling back to <title>.

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const KEEP = 10;
const BASE = 'https://dev.profullstack.com/~anthony/blog/';
const TITLE = "Chovy's Blog";
const DESC = 'Tech, agentic coding, and whatever else I\'m building. By Anthony "chovy" Ettinger.';
const AUTHOR = 'anthony@profullstack.com (Anthony Ettinger)';

const dir = dirname(fileURLToPath(import.meta.url));

const esc = (s) =>
	s.replace(/&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-f]+);)/gi, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');

// Entities used in the posts that XML doesn't define. Feed text is plain, so unwrap them.
const unentity = (s) =>
	s.replace(/&mdash;/g, '—')
		.replace(/&ndash;/g, '–')
		.replace(/&ldquo;/g, '“')
		.replace(/&rdquo;/g, '”')
		.replace(/&rsquo;/g, '’')
		.replace(/&amp;/g, '&');

// stripTags is for element bodies (<h1>, <title>); attribute values keep their
// angle brackets, so a description mentioning <meta> survives intact.
const grab = (html, re, stripTags = false) => {
	const m = html.match(re);
	if (!m) return null;
	return unentity(stripTags ? m[1].replace(/<[^>]+>/g, '').trim() : m[1].trim());
};

const files = (await readdir(dir)).filter((f) => /^\d+-post\.html$/.test(f));

const posts = [];
for (const file of files) {
	const html = await readFile(join(dir, file), 'utf8');
	const iso = grab(html, /<meta\s+name="date"\s+content="([^"]+)"/i);
	if (!iso) {
		console.warn(`skipping ${file}: no <meta name="date">`);
		continue;
	}
	const when = new Date(iso);
	if (Number.isNaN(when.getTime())) {
		console.warn(`skipping ${file}: unparseable date "${iso}"`);
		continue;
	}
	posts.push({
		file,
		when,
		title: grab(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i, true) ?? grab(html, /<title>([\s\S]*?)<\/title>/i, true) ?? file,
		desc: grab(html, /<meta\s+name="description"\s+content="([^"]+)"/i) ?? '',
	});
}

posts.sort((a, b) => b.when - a.when);
const kept = posts.slice(0, KEEP);
const dropped = posts.length - kept.length;

const items = kept
	.map((p) => {
		const url = BASE + p.file;
		return `		<item>
			<title>${esc(p.title)}</title>
			<link>${url}</link>
			<guid isPermaLink="true">${url}</guid>
			<pubDate>${p.when.toUTCString()}</pubDate>
			<dc:creator>Anthony Ettinger</dc:creator>
			<description>${esc(p.desc)}</description>
		</item>`;
	})
	.join('\n\n');

const xml = `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
	<channel>
		<title>${esc(TITLE)}</title>
		<link>${BASE}</link>
		<atom:link href="${BASE}feed.xml" rel="self" type="application/rss+xml"/>
		<description>${esc(DESC)}</description>
		<language>en-us</language>
		<managingEditor>${AUTHOR}</managingEditor>
		<webMaster>${AUTHOR}</webMaster>
		<generator>build-feed.mjs</generator>
		<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>

${items}
	</channel>
</rss>
`;

await writeFile(join(dir, 'feed.xml'), xml);
console.log(`feed.xml: ${kept.length} item(s)${dropped > 0 ? `, ${dropped} older post(s) trimmed` : ''}`);
