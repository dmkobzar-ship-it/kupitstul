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
    _, out, err = ssh.exec_command(cmd, timeout=20)
    o = out.read().decode("utf-8", errors="replace").strip()
    e = err.read().decode("utf-8", errors="replace").strip()
    if o: print(o)
    if e: print("STDERR:", e[:300])

# What are the "other" image sources?
run("""python3 -c "
import json, re
from urllib.parse import urlparse
from collections import Counter

d = json.load(open('/home/deploy/kupitstul/src/data/products.json'))
imgs = [u for p in d['products'] for u in p.get('images', [])]

hostnames = Counter()
for url in imgs:
    if url.startswith('/'):
        hostnames['[local /uploads]'] += 1
    elif url.startswith('http'):
        try:
            h = urlparse(url).hostname or 'unknown'
            hostnames[h] += 1
        except:
            hostnames['parse_error'] += 1
    else:
        hostnames['[other]'] += 1

for h, cnt in hostnames.most_common(15):
    print(f'  {cnt:6d} {h}')
" """, "Product image hostnames breakdown")

# Check first 5 products to see their image URLs
run("""python3 -c "
import json
d = json.load(open('/home/deploy/kupitstul/src/data/products.json'))
for p in d['products'][:3]:
    print(f\"{p['id']}: {p['images'][0][:80] if p['images'] else 'NO IMAGE'}\")
" """, "First 3 product image samples")

# Check what homepage popular products would look like (category stulya)
run("""python3 -c "
import json
d = json.load(open('/home/deploy/kupitstul/src/data/products.json'))
stulya = [p for p in d['products'] if p['category'] == 'stulya' and p['images']][:3]
for p in stulya:
    print(f\"  {p['images'][0][:80]}\")
" """, "Sample stulya product images (shown on homepage)")

ssh.close()
