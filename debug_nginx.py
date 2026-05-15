#!/usr/bin/env python3
import paramiko, os

HOST = "141.98.190.172"
USER = "root"
KEY_PATH = os.path.expanduser("~/.ssh/kupitstul_deploy")

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

# Check nginx volume mounts
run("docker inspect kupitstul_nginx_1 --format '{{json .Mounts}}' 2>&1")

# Check if files are visible inside nginx container
run("docker exec kupitstul_nginx_1 ls -la /usr/share/nginx/html/static/uploads/ 2>&1")

# Check the active nginx config inside container
run("docker exec kupitstul_nginx_1 cat /etc/nginx/nginx.conf | grep -A5 'uploads'")

# Also try direct apache-style test
run("docker exec kupitstul_nginx_1 ls /usr/share/nginx/html/static/ 2>&1")

ssh.close()
