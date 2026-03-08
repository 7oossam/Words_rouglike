import urllib.request
import re

url = "https://raw.githubusercontent.com/streetsidesoftware/cspell-dicts/main/dictionaries/ar/src/ayaspell/ar.dic"
dic_file = "ar.dic"
js_output = "arabic_dictionary.js"

try:
    print(f"Downloading from {url}...")
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as response:
        content = response.read().decode('utf-8')
    print("Download complete. Parsing lines...")
    
    lines = content.split('\n')
    words = []
    
    # First line of .dic is usually the word count, skip it if it's a number
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Strip Hunspell affix tags (e.g., word/A)
        word = line.split('/')[0]
        
        # Strip diacritics / tashkeel
        word = re.sub(r'[\u064B-\u065F\u0670]', '', word)
        
        # Only keep words 2 to 7 letters
        if 2 <= len(word) <= 7 and re.match(r'^[\u0600-\u06FF]+$', word):
            words.append(word)

    # removing duplicates
    unique_words = list(set(words))
    
    print(f"Extracted {len(unique_words)} valid words for the prototype.")
    
    import json
    with open(js_output, 'w', encoding='utf-8') as out:
        out.write("const FULL_DICTIONARY = ")
        json.dump(unique_words, out, ensure_ascii=False)
        out.write(";")
        
    print(f"Saved massive array to {js_output}")
    
except Exception as e:
    print(f"Error: {e}")
