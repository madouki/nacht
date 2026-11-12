# Treiber: schickt ein Skript an das Blender-Add-on (127.0.0.1:9876) und gibt das Ergebnis aus.
# python bl.py <skript.py> '<json CFG>' [timeout]
import socket, json, sys
def bl(code, timeout=600):
    s = socket.create_connection(('127.0.0.1', 9876), timeout=10)
    s.sendall(json.dumps({"type": "execute_code", "params": {"code": code}}).encode())
    s.settimeout(timeout); buf = b''
    while True:
        d = s.recv(1 << 16)
        if not d: break
        buf += d
        try: return json.loads(buf.decode())
        except Exception: pass
    return {'status': 'error', 'raw': buf[:400].decode(errors='replace')}
if __name__ == '__main__':
    path, cfg = sys.argv[1], sys.argv[2]
    timeout = int(sys.argv[3]) if len(sys.argv) > 3 else 600
    code = "CFG = %s\nexec(compile(open(%r, encoding='utf-8').read(), %r, 'exec'))" % (repr(json.loads(cfg)), path, path)
    r = bl(code, timeout)
    print(json.dumps(r)[:1500])
