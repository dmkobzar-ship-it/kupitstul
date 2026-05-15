#!/usr/bin/env python3
import paramiko
import os

HOST = "141.98.190.172"
KEY_PATH = os.path.expanduser("~/.ssh/kupitstul_deploy")

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username="root", key_filename=KEY_PATH, timeout=15)

def run(cmd, label=""):
    if label:
        print(f"\n=== {label} ===")
    _, out, err = ssh.exec_command(cmd, timeout=30)
    o = out.read().decode("utf-8", errors="replace").strip()
    if o: print(o)

# Homepage popular products - which domains are used?
run("""python3 << 'EOF'
import json, re
from urllib.parse import urlparse
from collections import Counter

d = json.load(open('/home/deploy/kupitstul/src/data/products.json'))

cats = ['stulya', 'barnye-stulya', 'kresla', 'stoly']
ASCII_SLUG = re.compile(r'^[a-z0-9_-]+$')

selected = []
for cat in cats:
    cat_prods = [p for p in d['products']
                 if p['category'] == cat and p.get('images') and ASCII_SLUG.match(p['slug'])]
    selected.extend(cat_prods[:2])

selected = selected[:8]
print(f"Homepage popular products: {len(selected)}")
for p in selected:
    img = p['images'][0] if p['images'] else 'NO IMG'
    host = urlparse(img).hostname if img.startswith('http') else 'local'
    print(f"  [{p['category']}] {host}: {img[:70]}")
EOF
""", "Homepage popular product image domains")

# Test tetchair and millargo directly (loading as a browser would)
run("""curl -s -o /dev/null -w 'tetchair direct: %{http_code}' \
--max-time 8 \
'https://tetchair.ru/netcat_files/63/71/19586v17671_1.jpg'""",
    "tetchair.ru direct (no referer)")

run("""curl -s -o /dev/null -w 'millargo direct: %{http_code}' \
--max-time 8 \
'https://millargo.ru/wp-content/uploads/flecto-puf-irbis-1000h1000-1.jpg'""",
    "millargo.ru direct (no referer)")

# Test red-black with short timeout
run("""curl -s -o /dev/null -w 'red-black direct: %{http_code}' \
--max-time 8 \
'http://www.red-black.ru/custom/dimages/big/7/6541.jpg'""",
    "red-black.ru direct (no referer)")

ssh.close()
