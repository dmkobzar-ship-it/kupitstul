#!/usr/bin/env python3
import paramiko, time, os

HOST = "141.98.190.172"
USER = "root"
KEY_PATH = os.path.expanduser("~/.ssh/kupitstul_deploy")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, key_filename=KEY_PATH, timeout=15)
print("[+] Connected")

def run(cmd, timeout=30):
    print(f"\n>>> {cmd}")
    _, stdout, _ = client.exec_command(cmd, timeout=timeout, get_pty=True)
    while not stdout.channel.exit_status_ready():
        if stdout.channel.recv_ready():
            print(stdout.channel.recv(4096).decode("utf-8", errors="replace"), end="", flush=True)
        time.sleep(0.1)
    rem = stdout.channel.recv(65536).decode("utf-8", errors="replace")
    if rem:
        print(rem, end="")

run('curl -s -o /dev/null -w "HTTP: %{http_code}\\n" https://kupitstul.ru/')
run('docker ps --format "{{.Names}} | {{.Status}}"')
run("docker logs kupitstul_app_1 --tail=40 2>&1")
run("df -h / | tail -1")

client.close()
print("\n[done]")
