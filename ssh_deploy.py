#!/usr/bin/env python3
"""Deploy kupitstul to production server via SSH.

Standard usage (server builds image locally):
    python ssh_deploy.py

Fast usage (after CI pushed image to GHCR, skip local build):
    python ssh_deploy.py --skip-build

Use --skip-build when GitHub Actions has already pushed the
image to GHCR and tagged it as kupitstul_app:latest on the server.
"""
import sys
import os
import getpass
import argparse
import paramiko
import time

HOST = "141.98.190.172"
USER = "root"
DEPLOY_DIR = "/home/deploy/kupitstul"
KEY_PATH = os.path.expanduser("~/.ssh/kupitstul_deploy")

PUBKEY = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAICHcR7P/fBQs+nB37ZncEzApkG0MgS6xcbQ2pXESgHUR github-actions-deploy"

# Commands that always run (no build)
COMMANDS_COMMON = [
    # Pull latest code (config files, nginx, etc.)
    (f"cd {DEPLOY_DIR} && git pull origin main 2>&1", 60),
    # Remove old app container only (postgres/redis stay up)
    ("docker ps -aq --filter 'label=com.docker.compose.project=kupitstul' "
     "--filter 'label=com.docker.compose.service=app' | xargs -r docker rm -f 2>&1 || true", 30),
    # Start new app container from pre-built image
    (f"cd {DEPLOY_DIR} && docker-compose up --no-build -d app 2>&1", 60),
    # Restart nginx to pick up nginx.conf changes (git pull replaces inode, reload reads stale)
    ("docker restart kupitstul_nginx_1 2>&1 || true", 30),
    # Wait for healthy response (up to 60s)
    ("for i in $(seq 1 30); do CODE=$(curl -so /dev/null -w '%{http_code}' --max-time 5 https://kupitstul.ru/ 2>/dev/null || echo 000); "
     "if [ \"$CODE\" = \"200\" ]; then echo \"Site OK: HTTP $CODE\"; break; fi; sleep 2; done", 70),
    # Show recent logs
    ("docker logs --tail=15 $(docker ps -q --filter 'label=com.docker.compose.service=app' | head -1) 2>&1 || true", 15),
    # Test orders API + MAX notification
    ("curl -s -X POST https://kupitstul.ru/api/orders "
     "-H 'Content-Type: application/json' "
     "-d '{\"customer\":{\"name\":\"Test\",\"phone\":\"+79991234567\"},"
     "\"items\":[{\"productId\":\"test\",\"name\":\"Стул тест\",\"price\":5000,\"quantity\":1}],"
     "\"subtotal\":5000,\"total\":5000}' 2>&1", 30),
]

# Build command (server-side Docker build, ~150s)
BUILD_CMD = (
    f"DOCKER_BUILDKIT=1 docker build -t kupitstul_app:latest {DEPLOY_DIR} 2>&1",
    600,
)


def run_cmd(client, cmd, timeout=120):
    short = cmd[:90] + ("..." if len(cmd) > 90 else "")
    print(f"\n\033[33m>>> {short}\033[0m")
    t0 = time.time()
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout, get_pty=True)
    while not stdout.channel.exit_status_ready():
        if stdout.channel.recv_ready():
            data = stdout.channel.recv(4096).decode("utf-8", errors="replace")
            print(data, end="", flush=True)
        time.sleep(0.1)
    remaining = stdout.channel.recv(65536).decode("utf-8", errors="replace")
    if remaining:
        print(remaining, end="", flush=True)
    exit_code = stdout.channel.recv_exit_status()
    elapsed = time.time() - t0
    color = "\033[31m" if exit_code != 0 else "\033[90m"
    print(f"{color}[{elapsed:.1f}s, exit={exit_code}]\033[0m")
    return exit_code, elapsed


def add_deploy_key(client):
    """Add GitHub Actions SSH public key to authorized_keys if not present."""
    check_cmd = f"grep -qF '{PUBKEY}' ~/.ssh/authorized_keys 2>/dev/null"
    _, stdout, _ = client.exec_command(check_cmd)
    if stdout.channel.recv_exit_status() != 0:
        print("\n\033[36m[+] Adding GitHub Actions deploy key to authorized_keys...\033[0m")
        add_cmd = (f"mkdir -p ~/.ssh && chmod 700 ~/.ssh && "
                   f"echo '{PUBKEY}' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys")
        run_cmd(client, add_cmd, timeout=10)
        print("\033[32m[+] Deploy key added!\033[0m")
    else:
        print("\033[32m[+] Deploy key already in authorized_keys\033[0m")


def main():
    parser = argparse.ArgumentParser(description="Deploy kupitstul to production")
    parser.add_argument(
        "--skip-build",
        action="store_true",
        help="Skip docker build on server (use when CI already pushed image to GHCR)",
    )
    args = parser.parse_args()

    print(f"\n\033[32mConnecting to {HOST}...\033[0m")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

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

    add_deploy_key(client)

    # Assemble command list
    commands = []
    if not args.skip_build:
        # Pull code first (needed for Dockerfile context), then build
        commands.append((f"cd {DEPLOY_DIR} && git pull origin main 2>&1", 60))
        commands.append(BUILD_CMD)
        # Common commands (git pull is already done above, skip duplicate)
        commands.extend(COMMANDS_COMMON[1:])
    else:
        print("\033[36m[i] --skip-build: skipping docker build, using existing image\033[0m")
        commands.extend(COMMANDS_COMMON)

    print("\n\033[35m========= STARTING DEPLOY =========\033[0m")
    if args.skip_build:
        print("\033[36m[mode: fast / skip-build]\033[0m")
    else:
        print("\033[36m[mode: full build on server ~150s]\033[0m")

    total_start = time.time()
    for cmd, timeout in commands:
        run_cmd(client, cmd, timeout=timeout)

    client.close()
    total = time.time() - total_start
    print(f"\n\033[32m========= DEPLOY COMPLETE ({total:.0f}s) =========\033[0m")


if __name__ == "__main__":
    main()

