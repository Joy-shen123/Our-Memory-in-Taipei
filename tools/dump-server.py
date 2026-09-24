#!/usr/bin/env python3
"""tools/dump-server.py — serve the page and catch what tools/scene-dump.js posts back.

    python3 tools/dump-server.py --port 8017 --out render

Plain static server for the repo (the glbs need http), plus one extra route: a POST to
/__dump__/<name>.json writes the body to <out>/<name>.json. That is how the scene JSON gets out of
the browser without going through the console, where a few MB of it would be truncated.
"""
import argparse
import http.server
import os
import pathlib
import socketserver

ap = argparse.ArgumentParser()
ap.add_argument('--port', type=int, default=8017)
ap.add_argument('--out', default='render')
ap.add_argument('--root', default='.')
A = ap.parse_args()

ROOT = pathlib.Path(A.root).resolve()
OUT = pathlib.Path(A.out).resolve()
OUT.mkdir(parents=True, exist_ok=True)


class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=str(ROOT), **k)

    def do_POST(self):
        if not self.path.startswith('/__dump__/'):
            self.send_error(404)
            return
        name = os.path.basename(self.path[len('/__dump__/'):]) or 'scene.json'
        if not name.endswith('.json'):
            name += '.json'
        body = self.rfile.read(int(self.headers.get('Content-Length', 0)))
        (OUT / name).write_bytes(body)
        print('wrote %s (%.2f MB)' % (OUT / name, len(body) / 1048576), flush=True)
        self.send_response(200)
        self.send_header('Content-Type', 'text/plain')
        self.end_headers()
        self.wfile.write(b'ok')

    def end_headers(self):
        # no caching: the page is edited between dumps and a 304 on app.js silently dumps the old one
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

    def log_message(self, fmt, *a):
        pass


class S(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


print('serving %s on http://localhost:%d/  dumps -> %s' % (ROOT, A.port, OUT), flush=True)
S(('127.0.0.1', A.port), H).serve_forever()
