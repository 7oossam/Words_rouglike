import urllib.request
import urllib.parse
import sys
import io

# Fix windows console unicode error
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf8')

def check_word(word):
    url = f"https://www.almaany.com/ar/dict/ar-ar/{urllib.parse.quote(word)}/"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
        'Referer': 'https://www.almaany.com/ar/dict/ar-ar/'
    }
    
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode('utf-8')
            if "نعتذر لم نتمكن من العثور" in content or "لا توجد نتائج" in content:
                print(f"NOT FOUND")
            else:
                print(f"FOUND")
    except Exception as e:
        print(f"ERROR: {e}")

check_word("تفرزه")
