"""Save canvas frames posted from the 3D city during visual QA.

The in-app browser pane is often hidden (document.hidden), which pauses the city's animation
loop. The dev-only handle window.__town.advance(frames) steps and renders frames directly, and
canvas.toDataURL() in the same task returns the rendered frame. The page then POSTs the data URL
here and this server writes it to disk. See HANDOVER.md, "Visual QA with a hidden browser".

Usage: python3 scripts/qa/capture-receiver.py <output-dir> [port]   (default port 5199)
Stop it with Ctrl+C or: pkill -f capture-receiver.py
"""
import base64, os, sys
from http.server import BaseHTTPRequestHandler, HTTPServer

OUT = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else 'qa-shots')
PORT = int(sys.argv[2]) if len(sys.argv) > 2 else 5199
os.makedirs(OUT, exist_ok=True)

class Handler(BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header('Access-Control-Allow-Origin', '*'); self.send_header('Access-Control-Allow-Headers', '*')
    def do_OPTIONS(self):
        self.send_response(204); self._cors(); self.end_headers()
    def do_POST(self):
        name = os.path.basename(self.path.strip('/')) or 'shot.jpg'
        body = self.rfile.read(int(self.headers.get('Content-Length', 0))).decode()
        with open(os.path.join(OUT, name), 'wb') as f: f.write(base64.b64decode(body.split(',', 1)[1]))
        self.send_response(200); self._cors(); self.end_headers(); self.wfile.write(b'ok')
    def log_message(self, *args): pass

print(f'capture receiver on http://127.0.0.1:{PORT} -> {OUT}')
HTTPServer(('127.0.0.1', PORT), Handler).serve_forever()
