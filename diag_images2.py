#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
import paramiko
import os
import urllib.request

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
    if e: print("STDERR:", e)

# 1. Count products.json images by type
run("python3 -c \""
    "import json,re;"
    "d=json.load(open('/home/deploy/kupitstul/src/data/products.json'));"
    "imgs=[u for p in d['products'] for u in p.get('images',[])];"
    "avito=sum(1 for u in imgs if 'avito.st' in u);"
    "uploads=sum(1 for u in imgs if u.startswith('/uploads'));"
    "other=len(imgs)-avito-uploads;"
    "print(f'Total imgs:{len(imgs)} avito:{avito} /uploads:{uploads} other:{other}');"
    "print(f'Products:{len(d[\\\"products\\\"])}')\""
    , "products.json image sources")

# 2. Test a raw Avito URL (without proxy, as a browser would)
run("curl -s -o /dev/null -w 'avito_direct: %{http_code}' "
    "'https://00.img.avito.st/image/1/1._d4l-LawUTcTT9M6U-evzGJZUzeVUVk9kw.jkP8adDP3gAfwrIWaw5gWtI60VPQxLJ5coXioezw6SU'",
    "Avito CDN direct (no Referer)")

# 3. Test Avito URL with Avito referer (as /api/img does)
run("curl -s -o /dev/null -w 'avito_with_referer: %{http_code}' "
    "-H 'Referer: https://www.avito.ru/' "
    "'https://00.img.avito.st/image/1/1._d4l-LawUTcTT9M6U-evzGJZUzeVUVk9kw.jkP8adDP3gAfwrIWaw5gWtI60VPQxLJ5coXioezw6SU'",
    "Avito CDN with Avito Referer (as /api/img does)")

# 4. Check if zaglushka exists in the container
run("docker exec kupitstul_app_1 ls -la /app/data/ 2>&1 | grep -i 'zaglushka\\|jpeg\\|jpg'",
    "zaglushka.jpeg in container")

# 5. Check homepage-config for /uploads/ entries
run("grep '/uploads/' /home/deploy/kupitstul/src/data/homepage-config.json",
    "homepage-config /uploads/ refs")

# 6. Check if uploads dir has all files
run("ls /home/deploy/kupitstul/public/uploads/ | grep -v gitkeep",
    "uploads on server")

ssh.close()
print("\nDone!")
