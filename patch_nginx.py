#!/usr/bin/env python3
"""Patch nginx config on server and reload (no rebuild needed)."""
import paramiko
import os
import time

HOST = "141.98.190.172"
USER = "root"
KEY_PATH = os.path.expanduser("~/.ssh/kupitstul_deploy")
DEPLOY_DIR = "/home/deploy/kupitstul"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, key_filename=KEY_PATH, timeout=15)
print("[+] Connected")

def run(cmd, timeout=30):
    print(f"\n>>> {cmd}")
    _, out, err = ssh.exec_command(cmd, timeout=timeout)
    o = out.read().decode("utf-8", errors="replace")
    e = err.read().decode("utf-8", errors="replace")
    if o: print(o)
    if e: print("STDERR:", e)

# Pull latest nginx.conf from git
run(f"cd {DEPLOY_DIR} && git pull origin main")

# Test nginx config
run("docker exec kupitstul_nginx_1 nginx -t 2>&1")

# Reload nginx
run("docker exec kupitstul_nginx_1 nginx -s reload 2>&1")

time.sleep(2)

# Test the images
run("curl -s -o /dev/null -w 'hero_slide: %{http_code}' https://kupitstul.ru/uploads/1772629293142-o56gh2.jpeg")
run("curl -s -o /dev/null -w 'category_stulya: %{http_code}' https://kupitstul.ru/uploads/1772629665826-o158yi.jpeg")
run("curl -s -o /dev/null -w 'extra1: %{http_code}' https://kupitstul.ru/uploads/1772698445455-1gnok2.jpg")
run("curl -s -o /dev/null -w 'extra2: %{http_code}' https://kupitstul.ru/uploads/1772700165688-5ksais.jpeg")

ssh.close()
print("\nDone!")
