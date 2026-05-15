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
    if e: print("ERR:", e[:300])

# Check homepage-config.json INSIDE THE CONTAINER via docker cp or cat
run("docker exec kupitstul_app_1 cat /app/src/data/homepage-config.json | grep -E '\"url\"|\"image\"' | head -40",
    "Container homepage-config images")

# Compare container file with git file
run("diff <(docker exec kupitstul_app_1 cat /app/src/data/homepage-config.json) /home/deploy/kupitstul/src/data/homepage-config.json | head -30",
    "Diff container vs git version")

# What docker volumes are mounted
run("docker inspect kupitstul_app_1 --format '{{range .Mounts}}{{.Type}} {{.Source}} -> {{.Destination}}\n{{end}}'",
    "Container volume mounts")

# Check /uploads content
run("ls -la /home/deploy/kupitstul/public/uploads/ | head -20",
    "Uploads directory on server")

ssh.close()
