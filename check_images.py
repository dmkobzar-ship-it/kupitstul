#!/usr/bin/env python3
import paramiko, os

host = "141.98.190.172"
key_path = os.path.expanduser("~/.ssh/kupitstul_deploy")

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(host, username="root", key_filename=key_path, timeout=15)

_, out, _ = ssh.exec_command("docker exec kupitstul_app_1 ls /app/public/uploads/")
print("Container uploads:", out.read().decode())

_, out, _ = ssh.exec_command(
    "curl -s -o /dev/null -w '%{http_code}' https://kupitstul.ru/uploads/1772629293142-o56gh2.jpeg"
)
print("Hero image status:", out.read().decode())

_, out, _ = ssh.exec_command(
    "curl -s -o /dev/null -w '%{http_code}' https://kupitstul.ru/uploads/1772629665826-o158yi.jpeg"
)
print("Category image status:", out.read().decode())

ssh.close()
