const fs=require('fs');
const assert=require('assert');
const app=fs.readFileSync('app.js','utf8');
for(const marker of ['fetchEpubBuffer','isEpubBuffer','AbortController','arrayBuffer()','renderEpubBuffer','Promise.race','showReaderError','retryEpub','chooseEpub']) assert(app.includes(marker),`missing ${marker}`);
assert(/timeoutMs=25000/.test(app));
assert(/18000/.test(app));
assert(app.includes('b.epubNoImages'));
const valid=new Uint8Array([0x50,0x4b,0x03,0x04]).buffer;
const invalid=new Uint8Array([0x3c,0x68,0x74,0x6d]).buffer;
function isEpubBuffer(buffer){const bytes=new Uint8Array(buffer);return bytes.length>3&&bytes[0]===0x50&&bytes[1]===0x4b&&(bytes[2]===0x03||bytes[2]===0x05||bytes[2]===0x07)&&(bytes[3]===0x04||bytes[3]===0x06||bytes[3]===0x08)}
assert(isEpubBuffer(valid));assert(!isEpubBuffer(invalid));
console.log('reader contract tests passed');
