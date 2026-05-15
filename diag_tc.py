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

# What image source does f2_tc-25443 product use?
run("""python3 << 'EOF'
import json
d = json.load(open('/home/deploy/kupitstul/src/data/products.json'))
# Find tc products
tc_prods = [p for p in d['products'] if 'tc' in p['id'].lower() and p.get('images')]
print(f"Products with 'tc' in id: {len(tc_prods)}")
for p in tc_prods[:5]:
    print(f"  {p['id']}: {p['images'][0][:80]}")
EOF
""", "TC product image sources")

# Test a tetchair.ru image URL directly (that would be used in live site)
run("""python3 << 'EOF'
import json
d = json.load(open('/home/deploy/kupitstul/src/data/products.json'))
tc_prods = [p for p in d['products'] if p.get('images') and 'tetchair.ru' in p['images'][0]]
if tc_prods:
    img = tc_prods[0]['images'][0]
    print(f"Sample tetchair URL: {img}")
else:
    print("No tetchair.ru images found in products")

# Check millargo
mill_prods = [p for p in d['products'] if p.get('images') and 'millargo.ru' in p['images'][0]]
if mill_prods:
    img = mill_prods[0]['images'][0]
    print(f"Sample millargo URL: {img}")
EOF
""", "tetchair/millargo URLs in products")

# Test tetchair URL from production server
run("""python3 << 'EOF'
import json, subprocess
d = json.load(open('/home/deploy/kupitstul/src/data/products.json'))
tetchair_prods = [p for p in d['products'] if p.get('images') and 'tetchair.ru' in p['images'][0]]
if tetchair_prods:
    url = tetchair_prods[0]['images'][0]
    result = subprocess.run(
        ['curl', '-s', '-o', '/dev/null', '-w', '%{http_code}', '--max-time', '8', url],
        capture_output=True, text=True
    )
    print(f"tetchair status: {result.stdout}")
    print(f"URL: {url[:80]}")
EOF
""", "Test actual tetchair product image")

# Check app logs for any HTTP errors related to image loading
run("docker logs kupitstul_app_1 --tail=100 2>&1 | grep -E '502|upstream|failed|tetchair|millargo' | head -20",
    "App log errors related to images")

ssh.close()
