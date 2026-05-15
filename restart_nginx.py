#!/usr/bin/env python3
import paramiko, os, time

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

# Restart nginx container so it picks up the new nginx.conf inode
run("docker restart kupitstul_nginx_1 2>&1")
time.sleep(3)

# Verify the new config is active
run("docker exec kupitstul_nginx_1 grep 'alias' /etc/nginx/nginx.conf")

# Test images
run("curl -s -o /dev/null -w 'hero_slide: %{http_code}\\n' https://kupitstul.ru/uploads/1772629293142-o56gh2.jpeg")
run("curl -s -o /dev/null -w 'category: %{http_code}\\n' https://kupitstul.ru/uploads/1772629665826-o158yi.jpeg")
run("curl -s -o /dev/null -w 'extra1: %{http_code}\\n' https://kupitstul.ru/uploads/1772698445455-1gnok2.jpg")

# Verify site is still up
run("curl -s -o /dev/null -w 'site: %{http_code}\\n' https://kupitstul.ru/")

ssh.close()
print("\nDone!")
