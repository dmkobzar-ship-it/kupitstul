#!/usr/bin/env python3
import paramiko, os

HOST = "141.98.190.172"
USER = "root"
KEY_PATH = os.path.expanduser("~/.ssh/kupitstul_deploy")

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, key_filename=KEY_PATH, timeout=15)

def run(cmd, timeout=30):
    print(f"\n>>> {cmd}")
    _, out, err = ssh.exec_command(cmd, timeout=timeout)
    o = out.read().decode("utf-8", errors="replace")
    e = err.read().decode("utf-8", errors="replace")
    if o: print(o)
    if e: print("STDERR:", e)

# Check actual file content
run("grep -n 'uploads' /home/deploy/kupitstul/nginx/nginx.conf")
run("grep -n 'alias' /home/deploy/kupitstul/nginx/nginx.conf")

# Also check the full uploads block on disk
run("sed -n '/location .uploads./,/}/p' /home/deploy/kupitstul/nginx/nginx.conf")

ssh.close()
