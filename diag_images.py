#!/usr/bin/env python3
import paramiko, os

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
    if o:
        print(o)
    if e:
        print("STDERR:", e)

# Test /api/img proxy
url = "https%3A%2F%2F00.img.avito.st%2Fimage%2F1%2F1._d4l-LawUTcTT9M6U-evzGJZUzeVUVk9kw.jkP8adDP3gAfwrIWaw5gWtI60VPQxLJ5coXioezw6SU"
run(f"curl -s -o /dev/null -w '%{{http_code}}' 'https://kupitstul.ru/api/img?url={url}'", "/api/img proxy HTTP status")

# Test sharp in container
run("docker exec kupitstul_app_1 node -e 'try{require(\"sharp\");console.log(\"sharp OK\")}catch(e){console.log(\"sharp FAIL:\",e.message)}' 2>&1", "sharp in container")

# Check recent app logs for errors
run("docker logs kupitstul_app_1 --tail=30 2>&1", "app logs tail")

ssh.close()
