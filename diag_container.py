#!/usr/bin/env python3
"""Check what files are in the running container at /app/src/data/"""
import paramiko, os

HOST = "141.98.190.172"
KEY_PATH = os.path.expanduser("~/.ssh/kupitstul_deploy")

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username="root", key_filename=KEY_PATH, timeout=15)

def run(cmd, label=""):
    if label:
        print(f"\n=== {label} ===")
    _, out, err = ssh.exec_command(cmd, timeout=15)
    o = out.read().decode("utf-8", errors="replace").strip()
    if o: print(o)

# What's in /app/src/data inside the container?
run("docker exec kupitstul_app_1 ls -lah /app/src/data/ 2>/dev/null || echo 'no src/data'",
    "/app/src/data in container")

# What's at /app/ root level?
run("docker exec kupitstul_app_1 ls -lah /app/ 2>/dev/null | head -20",
    "/app/ root in container")

# Is server.js using /app as cwd?
run("docker exec kupitstul_app_1 ls /app/server.js 2>/dev/null && echo 'found'",
    "server.js location")

# Check the process CWD   
run("docker exec kupitstul_app_1 sh -c 'ls /proc/1/cwd -la 2>/dev/null'",
    "Process CWD")

# Check if products.json is accessible
run("docker exec kupitstul_app_1 sh -c 'ls -lah /app/src/data/products.json 2>/dev/null || echo MISSING'",
    "products.json in container")

ssh.close()
