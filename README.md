# Lumière Premium Free Ebook Library

A responsive, installable static web app built with plain HTML, CSS, and JavaScript.

## Run locally

Because service workers require HTTP, use a local server instead of opening the file directly:

```bash
python -m http.server 8080
```

Then visit `http://localhost:8080`.

## Included

- Responsive premium interface
- Live Gutendex catalog with tens of thousands of Project Gutenberg records
- API search, topic filters, pagination, covers, formats, and download links
- Search, category filters, sorting, and saved-library view
- Book details and reader preview
- LocalStorage favorites, progress, font size, and theme
- Light/dark mode
- PWA manifest and offline service worker
- Accessible controls and keyboard close behavior
- No build step or framework required

## Connect real ebooks

The included text is a short original demonstration preview. To publish a live library, add only ebooks you are legally allowed to distribute. Add fields such as `epubUrl`, `pdfUrl`, and `contentUrl` to each book in `app.js`, then connect the download and reader actions to those URLs.

## Customize

- Catalog: edit `BOOKS` in `app.js`
- Brand colors and typography: edit CSS variables at the top of `styles.css`
- App metadata: edit `manifest.webmanifest`
- Cache version: increment `CACHE` in `sw.js` after releases

## Deployment

Upload all files to any static host such as GitHub Pages, Azure Static Web Apps, Netlify, or Cloudflare Pages. HTTPS is required for PWA installation outside localhost.

## Live data

The app queries `https://gutendex.com/books` with public-domain and English-language filters. For high-traffic production deployment, self-host Gutendex or add a backend cache. Rights can vary by jurisdiction, so keep the rights notice in the interface.

## Netlify live API and reader fix

This release includes `_redirects` to proxy Gutendex and Project Gutenberg through the Netlify site origin. The reader loads the available plain-text or HTML edition, splits it into readable pages, and saves the current page locally. Upload the entire folder or ZIP so `_redirects` is included.

## Curated books

The eight curated books now include direct Project Gutenberg plain-text, HTML, and EPUB URLs and can be read as complete ebooks. The app first calls Gutendex directly, retries through the Netlify proxy, and only then uses the curated collection. The unstable `copyright=false` query was removed; rights information remains visible per title.

## Version 5 universal search

Search now combines instant local matching with Open Library online discovery. Results include clear availability labels. Complete curated Project Gutenberg editions open in Lumière's paginated reader; Open Library results open the provider's reader or catalog page according to availability. Search requests are debounced, cached for one hour in the browser session, paginated, and retried through a Netlify proxy.

## Version 6 embedded readers and EPUB

- Project Gutenberg EPUB files open inside Lumière with epub.js and JSZip.
- EPUB position is saved as a CFI and restored when reopened.
- Previous and Next control the EPUB rendition.
- Internet Archive books open inside a full-screen embedded BookReader iframe.
- Text remains an automatic fallback if EPUB rendering fails.
- External navigation is only exposed as a fallback for publishers that prohibit iframe embedding.
