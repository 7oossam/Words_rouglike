const fs = require('fs');
const zlib = require('zlib');
const trieLib = require('cspell-trie-lib');

const dictPath = 'node_modules/@cspell/dict-ar/ar.trie.gz';
const outputPath = 'arabic_dictionary.js';

console.log('Reading cspell compressed trie...');
const fileBuffer = fs.readFileSync(dictPath);
const unzipped = zlib.gunzipSync(fileBuffer).toString('utf8');

console.log('Decoding Trie string...');
const trie = trieLib.parseDictionaryStringToTrie(unzipped);

console.log('Iterating all words in the Trie...');
const words = [];
for (const word of trie.words()) {
    // Only keep words fitting our prototype (2 to 7 letters) to keep file size reasonable
    // In a real game we would load the Trie directly, but for now we write out a JS array
    if (word.length >= 2 && word.length <= 7) {
        words.push(word);
    }
}

console.log(`Extracted ${words.length} words!`);

console.log('Writing to JS file...');
fs.writeFileSync(outputPath, `const FULL_DICTIONARY = ${JSON.stringify(words)};\n`, 'utf8');

console.log('Done!');
