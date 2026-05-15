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
    _, out, err = ssh.exec_command(cmd, timeout=20)
    o = out.read().decode("utf-8", errors="replace").strip()
    if o: print(o)

# Check homepage-config.json INSIDE THE CONTAINER (might be different from git)
run("""docker exec kupitstul_app_1 python3 -c "
import json
d = json.load(open('/app/src/data/homepage-config.json'))

print('=== heroSlides ===')
for s in d['heroSlides']:
    print(s.get('url', '')[:60])

print('=== categories ===')
for c in d['categories']:
    print(c['id'] + ': ' + c.get('image', '')[:60])

print('=== collections ===')
for c in d['collections']:
    print(c['id'] + ': ' + c.get('image', '')[:60])
" 2>/dev/null || echo "python3 not available"
""", "homepage-config.json INSIDE running container")

# Total image count per source in homepage-config
run("""python3 -c "
import json
d = json.load(open('/home/deploy/kupitstul/src/data/homepage-config.json'))
all_imgs = []
for s in d.get('heroSlides', []): all_imgs.append(s.get('url',''))
for c in d.get('categories', []): all_imgs.append(c.get('image',''))
for c in d.get('collections', []): all_imgs.append(c.get('image',''))
uploads = [u for u in all_imgs if u.startswith('/uploads')]
unsplash = [u for u in all_imgs if 'unsplash' in u]
other = [u for u in all_imgs if u and not u.startswith('/uploads') and 'unsplash' not in u]
print(f'Total: {len(all_imgs)}')
print(f'/uploads: {len(uploads)} -> {uploads}')
print(f'unsplash: {len(unsplash)}')
print(f'other: {len(other)} -> {other}')
"
""", "homepage-config on server (git version)")

ssh.close()
