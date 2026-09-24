"""
EqD Trading Academy - servidor local.
Usa apenas a biblioteca padrao do Python (3.8+). Nada para instalar.

  python server.py            -> sobe em http://localhost:8765 e abre o navegador
  python server.py --port 9000 --no-browser
"""
import argparse
import json
import os
import sqlite3
import sys
import threading
import time
import webbrowser
from datetime import datetime
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))
STATIC = os.path.join(ROOT, "static")
DATA_DIR = os.path.join(ROOT, "data")
DB_PATH = os.path.join(DATA_DIR, "progress.db")
BOOKS_DIR = os.path.join(ROOT, "Books")
MAX_BODY = 20 * 1024 * 1024
# livros da pasta Books: chave -> trechos do nome do arquivo (sem diferenciar maiusculas)
BOOK_PATTERNS = {
    "hull": ["hull"],
    "wil": ["wilmott on quantitative"],
    "der": ["theory and practice of financial engineering"],
    "mfd": ["mathematics of financial derivatives"],
    "ek": ["elliot", "mathematics of financial markets"],
    "ff": ["fabozzi", "financial modelling", "financial modeling"],
    "car": ["carreira", "brazilian derivatives"],
    "cqf": ["cqf", "certificate in quantitative finance"],
}
KEEP_BACKUPS = 30

_db_lock = threading.Lock()


def db():
    conn = sqlite3.connect(DB_PATH, timeout=10)
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def init_db():
    os.makedirs(DATA_DIR, exist_ok=True)
    with _db_lock, db() as c:
        c.execute("CREATE TABLE IF NOT EXISTS state (id INTEGER PRIMARY KEY CHECK (id = 1), json TEXT NOT NULL, updated TEXT NOT NULL)")
        c.execute("CREATE TABLE IF NOT EXISTS backups (id INTEGER PRIMARY KEY AUTOINCREMENT, json TEXT NOT NULL, created TEXT NOT NULL)")
        c.execute("CREATE TABLE IF NOT EXISTS attempts (id INTEGER PRIMARY KEY AUTOINCREMENT, ts TEXT, kind TEXT, ref TEXT, tag TEXT, ok INTEGER)")


def get_state():
    with _db_lock, db() as c:
        row = c.execute("SELECT json, updated FROM state WHERE id = 1").fetchone()
    if not row:
        return None, None
    return json.loads(row[0]), row[1]


def put_state(obj):
    now = datetime.now().isoformat(timespec="seconds")
    payload = json.dumps(obj, ensure_ascii=False)
    with _db_lock, db() as c:
        old = c.execute("SELECT json, updated FROM state WHERE id = 1").fetchone()
        c.execute("INSERT INTO state (id, json, updated) VALUES (1, ?, ?) ON CONFLICT(id) DO UPDATE SET json = excluded.json, updated = excluded.updated", (payload, now))
        # backup a cada hora (no maximo), mantendo os ultimos KEEP_BACKUPS
        last = c.execute("SELECT created FROM backups ORDER BY id DESC LIMIT 1").fetchone()
        if old and (not last or (datetime.now() - datetime.fromisoformat(last[0])).total_seconds() > 3600):
            c.execute("INSERT INTO backups (json, created) VALUES (?, ?)", (old[0], now))
            c.execute("DELETE FROM backups WHERE id NOT IN (SELECT id FROM backups ORDER BY id DESC LIMIT ?)", (KEEP_BACKUPS,))
    return now


def log_attempts(items):
    rows = []
    for it in items:
        rows.append((it.get("ts") or datetime.now().isoformat(timespec="seconds"), str(it.get("kind", ""))[:40],
                     str(it.get("ref", ""))[:120], str(it.get("tag", ""))[:60], 1 if it.get("ok") else 0))
    with _db_lock, db() as c:
        c.executemany("INSERT INTO attempts (ts, kind, ref, tag, ok) VALUES (?, ?, ?, ?, ?)", rows)


def list_backups():
    with _db_lock, db() as c:
        return [{"id": r[0], "created": r[1]} for r in c.execute("SELECT id, created FROM backups ORDER BY id DESC")]


def restore_backup(bid):
    with _db_lock, db() as c:
        row = c.execute("SELECT json FROM backups WHERE id = ?", (bid,)).fetchone()
    if not row:
        return False
    put_state(json.loads(row[0]))
    return True


def find_book(key):
    pats = BOOK_PATTERNS.get(key)
    if not pats or not os.path.isdir(BOOKS_DIR):
        return None
    for fn in sorted(os.listdir(BOOKS_DIR)):
        low = fn.lower()
        if low.endswith(".pdf") and any(p in low for p in pats):
            return os.path.join(BOOKS_DIR, fn)
    return None


def list_books():
    return {k: (os.path.basename(find_book(k)) if find_book(k) else None) for k in BOOK_PATTERNS}


class Handler(SimpleHTTPRequestHandler):
    # No Windows o registro as vezes mapeia .js como text/plain; forcamos os tipos corretos.
    extensions_map = dict(SimpleHTTPRequestHandler.extensions_map)
    extensions_map.update({".js": "application/javascript", ".css": "text/css", ".html": "text/html",
                           ".woff2": "font/woff2", ".json": "application/json", ".svg": "image/svg+xml"})

    def guess_type(self, path):
        ext = os.path.splitext(path)[1].lower()
        return self.extensions_map.get(ext) or super().guess_type(path)

    def __init__(self, *a, **kw):
        super().__init__(*a, directory=STATIC, **kw)

    def log_message(self, fmt, *args):
        if "/api/" in (args[0] if args else ""):
            return
        sys.stderr.write("[%s] %s\n" % (time.strftime("%H:%M:%S"), fmt % args))

    def end_headers(self):
        self.send_header("Cache-Control", "private, max-age=3600" if getattr(self, "_cache_ok", False) else "no-store")
        super().end_headers()

    def _send_book(self, head_only=False):
        key = self.path.split("?")[0].split("#")[0].rstrip("/").split("/")[-1]
        path = find_book(key)
        if not path:
            body = ("<html><meta charset='utf-8'><body style='font-family:sans-serif;background:#0a0e13;color:#d8e0ea;padding:40px'>"
                    "<h2>Livro n&atilde;o encontrado</h2><p>Coloque o PDF na pasta <b>Books</b> (ao lado do server.py) e recarregue.</p></body></html>").encode("utf-8")
            self.send_response(404)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            if not head_only:
                self.wfile.write(body)
            return
        size = os.path.getsize(path)
        start, end, code = 0, size - 1, 200
        rng = self.headers.get("Range")
        if rng and rng.startswith("bytes="):
            try:
                a, b = rng[6:].split(",")[0].strip().split("-")
                if a:
                    start = int(a)
                    end = int(b) if b else size - 1
                else:
                    start = max(0, size - int(b))
                end = min(end, size - 1)
                if start > end:
                    self.send_response(416)
                    self.send_header("Content-Range", "bytes */%d" % size)
                    self.end_headers()
                    return
                code = 206
            except ValueError:
                start, end, code = 0, size - 1, 200
        self._cache_ok = True
        self.send_response(code)
        self.send_header("Content-Type", "application/pdf")
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Content-Length", str(end - start + 1))
        if code == 206:
            self.send_header("Content-Range", "bytes %d-%d/%d" % (start, end, size))
        safe = "".join(ch if ch.isascii() and ch not in '"\\' else "_" for ch in os.path.basename(path))
        self.send_header("Content-Disposition", 'inline; filename="%s"' % safe)
        self.end_headers()
        if head_only:
            return
        try:
            with open(path, "rb") as f:
                f.seek(start)
                left = end - start + 1
                while left > 0:
                    chunk = f.read(min(1024 * 256, left))
                    if not chunk:
                        break
                    self.wfile.write(chunk)
                    left -= len(chunk)
        except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError):
            pass

    def do_HEAD(self):
        if self.path.startswith("/books/"):
            return self._send_book(head_only=True)
        return super().do_HEAD()

    def _json(self, code, obj):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _body(self):
        n = int(self.headers.get("Content-Length") or 0)
        if n > MAX_BODY:
            raise ValueError("payload grande demais")
        return json.loads(self.rfile.read(n).decode("utf-8") or "null")

    def do_GET(self):
        if self.path.startswith("/api/state"):
            st, upd = get_state()
            return self._json(200, {"state": st, "updated": upd})
        if self.path.startswith("/api/backups"):
            return self._json(200, {"backups": list_backups()})
        if self.path.startswith("/api/ping"):
            return self._json(200, {"ok": True})
        if self.path.startswith("/api/books"):
            return self._json(200, {"books": list_books()})
        if self.path.startswith("/books/"):
            return self._send_book()
        return super().do_GET()

    def do_PUT(self):
        if self.path.startswith("/api/state"):
            try:
                obj = self._body()
                if not isinstance(obj, dict):
                    return self._json(400, {"error": "estado invalido"})
                return self._json(200, {"ok": True, "updated": put_state(obj)})
            except Exception as e:  # noqa
                return self._json(400, {"error": str(e)})
        self._json(404, {"error": "not found"})

    def do_POST(self):
        try:
            if self.path.startswith("/api/attempts"):
                items = self._body() or []
                if isinstance(items, list):
                    log_attempts(items[:500])
                return self._json(200, {"ok": True})
            if self.path.startswith("/api/restore"):
                obj = self._body() or {}
                ok = restore_backup(int(obj.get("id", 0)))
                return self._json(200 if ok else 404, {"ok": ok})
        except Exception as e:  # noqa
            return self._json(400, {"error": str(e)})
        self._json(404, {"error": "not found"})


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, default=int(os.environ.get("EQD_PORT", "8765")))
    ap.add_argument("--no-browser", action="store_true")
    args = ap.parse_args()
    init_db()
    try:
        srv = ThreadingHTTPServer(("127.0.0.1", args.port), Handler)
    except OSError:
        url = "http://localhost:%d" % args.port
        print("Porta %d ja esta em uso - provavelmente o app ja esta rodando. Abrindo %s" % (args.port, url))
        if not args.no_browser:
            webbrowser.open(url)
        return
    url = "http://localhost:%d" % args.port
    print("=" * 60)
    print(" EqD Trading Academy rodando em %s" % url)
    print(" Progresso salvo em: %s" % DB_PATH)
    print(" Para parar: feche esta janela ou pressione Ctrl+C")
    print("=" * 60)
    if not args.no_browser:
        threading.Timer(1.0, lambda: webbrowser.open(url)).start()
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        srv.server_close()


if __name__ == "__main__":
    main()
