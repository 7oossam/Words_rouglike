import urllib.request
import urllib.parse
from http.server import BaseHTTPRequestHandler, HTTPServer
import json

class AlmaanyValidationHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        # Handle CORS preflight
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'X-Requested-With')
        self.end_headers()

    def do_GET(self):
        # Handle CORS for GET
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-type', 'application/json; charset=utf-8')
        self.end_headers()

        if self.path.startswith("/validate?word="):
            word_encoded = self.path.split("=")[1]
            word = urllib.parse.unquote(word_encoded)
            is_valid = self.check_almaany(word)
            
            response = {"word": word, "valid": is_valid}
            self.wfile.write(json.dumps(response).encode('utf-8'))
        else:
            self.wfile.write(json.dumps({"error": "Use /validate?word=... "}).encode('utf-8'))

    def check_almaany(self, word):
        url = f"https://www.almaany.com/ar/dict/ar-ar/{urllib.parse.quote(word)}/"
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
            'Referer': 'https://www.almaany.com/'
        }
        
        req = urllib.request.Request(url, headers=headers)
        try:
            with urllib.request.urlopen(req) as resp:
                content = resp.read().decode('utf-8')
                if "نعتذر لم نتمكن من العثور" in content or "لا توجد نتائج" in content:
                    return False
                return True
        except Exception as e:
            print(f"Error checking almaany: {e}")
            return False # Fail strict

if __name__ == '__main__':
    port = 8765
    server_address = ('', port)
    httpd = HTTPServer(server_address, AlmaanyValidationHandler)
    print(f"Arabic Validation API Server running on port {port}...")
    print("Keep this terminal open while playing the game!")
    httpd.serve_forever()
