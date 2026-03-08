import gzip
import json
import re

input_file = "node_modules/@cspell/dict-ar/ar.trie.gz"
output_file = "arabic_dictionary.js"

print("Reading and parsing...")

def is_arabic(text):
    # Basic check for arabic characters
    return bool(re.match(r'^[\u0600-\u06FF]+$', text))

words = []
try:
    with gzip.open(input_file, 'rt', encoding='utf-8') as f:
        content = f.read()
        
        # cspell trie format contains the raw strings often separated by newlines
        # or packed in a specific format. Since we just need *any* massive list 
        # of valid words for this prototype quickly, we can just regex extract 
        # any continuous sequences of Arabic characters from the decompressed text
        
        matches = re.findall(r'[\u0600-\u06FF]{2,}', content) 
        
        # remove duplicates and keep words between 2 and 7 letters (prototype sizes)
        unique_words = set()
        for w in matches:
            if 2 <= len(w) <= 7:
                unique_words.add(w)
        
        words = list(unique_words)
        
    print(f"Extracted {len(words)} unique Arabic words from the trie data.")
    
    # Write them out as a JS file so we can just include it in the HTML
    with open(output_file, 'w', encoding='utf-8') as out:
        out.write("const FULL_DICTIONARY = ")
        json.dump(words, out, ensure_ascii=False)
        out.write(";")
        
    print(f"Saved to {output_file}")

except Exception as e:
    print(f"Error: {e}")
