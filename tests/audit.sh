#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
node --check core.js
node --check app.js
node --check sw.js
node tests/core.test.js
node tests/reader-contract.test.js
test -f _redirects
grep -q '^/gutenberg/' _redirects
grep -q 'epubjs@0.3.93' index.html
grep -q 'data/catalog.json' app.js
grep -q 'search.opds' app.js
! grep -R 'archive.org' index.html app.js _redirects
echo 'static audit passed'
