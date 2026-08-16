# Chovy's Blog

Plain static HTML. No framework, no build step, no CSS, no JavaScript.

Live at <https://dev.profullstack.com/~anthony/blog/>, served straight out of
`~/public_html/blog/` — editing a file here *is* publishing it.

Every page validates against the [smolweb](https://smolweb.org) HTML subset.

## Adding a post

1. Create `NNN-post.html` (`003-post.html`, and so on), copying the structure of
   an existing post. Two tags in `<head>` are required — the feed generator reads
   them:

   ```html
   <meta name="date" content="2026-08-14T11:58:00Z">
   <meta name="description" content="one-line summary, used as the feed item description">
   ```

   The feed item's title comes from the page's `<h1>`.

2. Rebuild the feed:

   ```sh
   node build-feed.mjs
   ```

   It sorts by date, keeps the **10 most recent** posts, and trims the rest.

3. Add the post to the list in `index.html` by hand. The generator deliberately
   does not touch it.

## Staying smolweb-valid

The spec is stricter than browsers are. When adding a post, keep:

- an explicit `<html lang="en">`, `<head>` and `<body>`, all closed
- every `<p>` closed — implicit closing tags fail validation
- `<meta http-equiv="Content-Type" content="text/html; charset=utf-8">` rather
  than `<meta charset>`, because every `<meta>` needs a `content` attribute

Check a page after publishing at <https://smolweb.org/validator/>.

## Summary page on GitHub Pages

<https://ralyodio.github.io/blog/> is a summary index built from the blog's RSS
feed. It lists the title, date and description of each post in the feed and
links to the post on the blog — it never hosts the post text itself.

```sh
node tools/build-pages.mjs          # writes site/index.html from the live feed
node tools/build-pages.mjs --feed feed.xml --out /tmp/preview
```

The page is generated rather than fetched in the browser, because the blog does
not send CORS headers — a client-side `fetch` of `feed.xml` from
`ralyodio.github.io` would be blocked. That also means the published page needs
no JavaScript.

`.github/workflows/pages.yml` rebuilds and deploys it every six hours and on
push, so **publishing a post to the blog is enough** — the summary page picks it
up from the live feed whether or not the post has been mirrored into this repo.
If the blog is unreachable at build time the builder falls back to the `feed.xml`
committed here, and it fails rather than publishing an empty page.

Because the feed keeps only the 10 most recent posts, so does this page. The
full archive stays on the blog.

## AI disclosure

Posts here are drafted with AI assistance from my own notes and experience, and
published under my name. Where an LLM did the heavy lifting on the prose, the
post says so inline.
