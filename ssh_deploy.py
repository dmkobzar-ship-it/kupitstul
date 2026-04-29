#!/usr/bin/env python3
"""Deploy kupitstul to production server via SSH (key auth, no password needed)."""
import sys
import os
import getpass
import paramiko
import time

HOST = "141.98.190.172"
USER = "root"
DEPLOY_DIR = "/home/deploy/kupitstul"
KEY_PATH = os.path.expanduser("~/.ssh/kupitstul_deploy")

PUBKEY = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAICHcR7P/fBQs+nB37ZncEzApkG0MgS6xcbQ2pXESgHUR github-actions-deploy"

COMMANDS = [
    # Pull latest code
    f"cd {DEPLOY_DIR} && git pull origin main 2>&1",
    # Build with docker build directly (not docker-compose build):
    # docker-compose build + BuildKit produces OCI manifest lists which
    # break docker-compose v1.29 (no ContainerConfig). docker build outputs
    # regular Docker images that docker-compose v1.29 can handle.
    f"DOCKER_BUILDKIT=1 docker build -t kupitstul_app:latest {DEPLOY_DIR} 2>&1",
    # Remove ALL old app containers (by label, handles hash-prefixed names)
    "docker ps -aq --filter 'label=com.docker.compose.project=kupitstul' "
    "--filter 'label=com.docker.compose.service=app' | xargs -r docker rm -f 2>&1 || true",
    # Start container (no build needed - image already built)
    f"cd {DEPLOY_DIR} && docker-compose up --no-build -d app 2>&1",
    # Reload nginx to pick up any nginx.conf changes (no downtime)
    "docker exec kupitstul_nginx_1 nginx -s reload 2>&1 || true",
    # Wait for app to start
    "sleep 8",
    # Check logs
    "docker logs kupitstul_app_1 --tail=10 2>&1",
    # Test site
    "curl -s -o /dev/null -w 'Site: %{http_code}\\n' https://kupitstul.ru/",
    # Test order + MAX notification
    "curl -s -X POST https://kupitstul.ru/api/orders "
    "-H 'Content-Type: application/json' "
    "-d '{\"customer\":{\"name\":\"Test MAX\",\"phone\":\"+79991234567\"},\"items\":[{\"productId\":\"test\",\"name\":\"Стул тестовый\",\"price\":5000,\"quantity\":1}],\"subtotal\":5000,\"total\":5000}' 2>&1",
    # Check app logs after order for MAX result
    "docker logs kupitstul_app_1 --tail=25 2>&1",
]

def run_cmd(client, cmd, timeout=120):
    print(f"\n\033[33m>>> {cmd[:80]}{'...' if len(cmd) > 80 else ''}\033[0m")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout, get_pty=True)
    while not stdout.channel.exit_status_ready():
        if stdout.channel.recv_ready():
            data = stdout.channel.recv(4096).decode('utf-8', errors='replace')
            print(data, end='', flush=True)
        time.sleep(0.1)
    # Read remaining
    remaining = stdout.channel.recv(65536).decode('utf-8', errors='replace')
    if remaining:
        print(remaining, end='', flush=True)
    exit_code = stdout.channel.recv_exit_status()
    if exit_code != 0:
        print(f"\033[31m[exit code: {exit_code}]\033[0m")
    return exit_code

def add_deploy_key(client):
    """Add GitHub Actions SSH public key to authorized_keys if not present."""
    check_cmd = f"grep -qF '{PUBKEY}' ~/.ssh/authorized_keys 2>/dev/null"
    _, stdout, _ = client.exec_command(check_cmd)
    if stdout.channel.recv_exit_status() != 0:
        print("\n\033[36m[+] Adding GitHub Actions deploy key to authorized_keys...\033[0m")
        add_cmd = f"mkdir -p ~/.ssh && chmod 700 ~/.ssh && echo '{PUBKEY}' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
        run_cmd(client, add_cmd, timeout=10)
        print("\033[32m[+] Deploy key added!\033[0m")
    else:
        print("\033[32m[+] Deploy key already in authorized_keys\033[0m")

def main():
    print(f"\n\033[32mConnecting to {HOST}...\033[0m")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    # Try key auth first (no password needed), fall back to password
    connected = False
    if os.path.exists(KEY_PATH):
        try:
            client.connect(HOST, username=USER, key_filename=KEY_PATH, timeout=15)
            print(f"\033[32m[+] Connected via SSH key ({KEY_PATH})\033[0m")
            connected = True
        except Exception as e:
            print(f"\033[33m[!] Key auth failed: {e} — trying password...\033[0m")

    if not connected:
        password = getpass.getpass(f"Enter password for root@{HOST}: ")
        try:
            client.connect(HOST, username=USER, password=password, timeout=15)
            print("\033[32m[+] Connected via password\033[0m")
        except Exception as e:
            print(f"\033[31mConnection failed: {e}\033[0m")
            sys.exit(1)
    
    # Add GitHub Actions key for future auto-deploys
    add_deploy_key(client)
    
    print("\n\033[35m========= STARTING DEPLOY =========\033[0m")
    
    for i, cmd in enumerate(COMMANDS):
        t = 600 if 'build' in cmd else (60 if 'sleep' not in cmd else 30)
        code = run_cmd(client, cmd, timeout=t)
    
    client.close()
    print("\n\033[32m========= DEPLOY COMPLETE =========\033[0m")

if __name__ == "__main__":
    main()
