# Lumière Gutenberg Library v9

A Netlify-ready static ebook app.

## Architecture

- Bundled starter catalog for immediate and offline search.
- Official Project Gutenberg OPDS search for additional titles.
- Same-origin Netlify proxy for OPDS and selected EPUB files.
- epub.js reader with pagination, font size, and saved CFI position.
- No API key, database, or build step.

## Deploy

Upload this folder or ZIP with Netlify Drop. Keep `_redirects` at the publish root. After replacing an older version, clear the old service worker or hard refresh.

## Rights

Project Gutenberg identifies its collection for U.S. copyright purposes. Users should verify the law applicable in their country before downloading or redistributing a title.

## Tests

Run `bash tests/audit.sh`.

## Version 10 reader loading fix

Remote EPUB files are downloaded as binary ArrayBuffers, checked for the ZIP/EPUB signature, and only then passed to epub.js. Each network request has a 25-second abort timeout and rendering has an 18-second timeout. The reader tries image and no-images editions, then shows Retry and local EPUB actions instead of loading forever.
