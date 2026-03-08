import urllib.request

url = "https://raw.githubusercontent.com/linuxscout/mishkal/master/tests/data/wordlist.txt"
output_file = "arabic_words.txt"

try:
    print(f"Downloading from {url}...")
    urllib.request.urlretrieve(url, output_file)
    print("Download complete.")
except Exception as e:
    print(f"Error downloading: {e}")

# Let's try another source if that fails
url2 = "https://raw.githubusercontent.com/OpenArabic/Arabic-Wordlist/master/arabic-wordlist-1.6.txt"
output_file2 = "arabic_words_large.txt"

try:
    print(f"Downloading from {url2}...")
    urllib.request.urlretrieve(url2, output_file2)
    print("Download complete.")
except Exception as e:
    print(f"Error downloading: {e}")
