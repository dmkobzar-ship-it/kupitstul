#!/usr/bin/env python3
import paramiko
import os
import json

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
    e = err.read().decode("utf-8", errors="replace").strip()
    if o: print(o)
    if e: print("STDERR:", e[:300])

# Get sample images from each supplier (directly on server)
run("""python3 << 'EOF'
import json
d = json.load(open('/home/deploy/kupitstul/src/data/products.json'))
seen = {}
for p in d['products']:
    for img in p.get('images', []):
        if 'tetchair' in img and 'tetchair' not in seen:
            seen['tetchair'] = img
        elif 'red-black' in img and 'red-black' not in seen:
            seen['red-black'] = img
        elif 'millargo' in img and 'millargo' not in seen:
            seen['millargo'] = img
for k,v in seen.items():
    print(k, v[:100])
EOF
""", "Sample images per supplier")

# Test each supplier with kupitstul.ru referer (simulating browser on site)
run("""curl -s -o /dev/null -w 'tetchair NO referer: %{http_code}' \
'https://content.tetchair.ru/storage/catalog/products/TC-11/tc-11_pu_-_mex-2.jpg' 2>/dev/null || echo 'FAILED'""",
    "tetchair.ru - no referer")
run("""curl -s -o /dev/null -w 'tetchair with kupitstul referer: %{http_code}' \
-H 'Referer: https://kupitstul.ru/' \
'https://content.tetchair.ru/storage/catalog/products/TC-11/tc-11_pu_-_mex-2.jpg' 2>/dev/null || echo 'FAILED'""",
    "tetchair.ru - with kupitstul referer")
run("""curl -s -o /dev/null -w 'price.tetchair NO referer: %{http_code}' \
'https://price.tetchair.ru/catalog/products/' 2>/dev/null || echo 'FAILED'""",
    "price.tetchair.ru - no referer")

# Try red-black
run("""curl -s -o /dev/null -w 'red-black NO referer: %{http_code}' \
-H 'Referer: https://kupitstul.ru/' \
'https://www.red-black.ru/image/' 2>/dev/null || echo 'FAILED'""",
    "red-black.ru - with kupitstul referer")

ssh.close()
