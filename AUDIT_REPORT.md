# Lumière v9 Audit Report

## Scope

Static Netlify package, bundled catalog, local search, official Project Gutenberg OPDS search routing, EPUB URL generation, epub.js reader controls, favorites, theme, PWA shell, and deployment configuration.

## Automated checks passed

- JavaScript syntax: `core.js`, `app.js`, and `sw.js`
- Catalog schema: 49 valid starter records with integer Gutenberg IDs
- URL generation: image and no-image EPUB paths
- Search: title, author, category, accent normalization, and Gutenberg ID
- Favorites deduplication helper
- Required application files and Netlify redirect rules
- OPDS search integration marker
- EPUB.js integration marker
- No Archive.org runtime dependency
- Local HTTP serving of `index.html` and `data/catalog.json`
- ZIP integrity

## Design and reliability findings

- The bundled catalog is always displayed and searched locally, even when the online search is unavailable.
- Online expansion uses Project Gutenberg's official OPDS endpoint through a Netlify same-origin proxy.
- The public Gutendex server is not required.
- EPUB loading tries the image edition first and then the no-images edition.
- EPUB position is saved with a CFI in browser local storage.
- Service-worker cache version is `lumiere-v9` and excludes Gutenberg proxy requests so remote search and EPUB responses are not replaced by the app shell.

## Known external dependencies

- Project Gutenberg availability and the presence of an EPUB for the selected record.
- JSZip and epub.js CDN availability on first load.
- Public-domain status can differ outside the United States.

## Result

PASS for static package, local search, routing, reader wiring, PWA shell, and Netlify deployment structure.
