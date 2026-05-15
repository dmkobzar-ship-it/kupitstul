#!/usr/bin/env python3
import paramiko, os, json, urllib.request, urllib.error

HOST = "141.98.190.172"
KEY_PATH = os.path.expanduser("~/.ssh/kupitstul_deploy")

# Also test a few avito.st URLs directly to see if they're still valid
with open(r"c:\myProjects\kupitstul-demo\src\data\products.json", encoding="utf-8") as f:
    data = json.load(f)

products = data.get("products", data) if isinstance(data, dict) else data
print(f"Total products: {len(products)}")

# Check 5 avito.st image URLs directly
avito_products = [p for p in products if p.get("images") and p["images"][0].startswith("http") and "avito.st" in p["images"][0]]
print(f"Products with avito.st images: {len(avito_products)}")

print("\nTesting 5 avito.st URLs directly from THIS machine:")
for p in avito_products[:5]:
    url = p["images"][0]
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0", "Referer": "https://www.avito.ru/"})
        with urllib.request.urlopen(req, timeout=8) as r:
            print(f"  {r.status} [{r.headers.get('content-type','?')}] {url[:60]}")
    except urllib.error.HTTPError as e:
        print(f"  HTTP {e.code}: {url[:60]}")
    except Exception as ex:
        print(f"  ERROR {ex}: {url[:60]}")

# Check tetchair.ru image
tc_products = [p for p in products if p.get("images") and "tetchair.ru" in p["images"][0]]
print(f"\nProducts with tetchair.ru images: {len(tc_products)}")
for p in tc_products[:3]:
    url = p["images"][0]
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=8) as r:
            print(f"  {r.status} {url[:70]}")
    except urllib.error.HTTPError as e:
        print(f"  HTTP {e.code}: {url[:70]}")
    except Exception as ex:
        print(f"  ERROR {ex}: {url[:70]}")
