#!/usr/bin/env python3
"""End-to-End Production Verification & Smoke Test Script for A-Little-World-With-Us.

Designed for post-deployment automated health check and synthetic transaction verification.
Usage:
  python scripts/verify_production.py --app-url http://127.0.0.1:3004
"""

import argparse
import os
import sys
import time
import urllib.request
import json
from typing import Dict, Any, Tuple


class SmokeTester:
    def __init__(self, app_url: str, timeout: int = 10):
        self.app_url = app_url.rstrip("/")
        self.timeout = timeout
        self.passed = 0
        self.failed = 0

    def log(self, status: str, check_name: str, detail: str = ""):
        prefix = f"[{time.strftime('%Y-%m-%d %H:%M:%S')}]"
        badge = f"[{status}]"
        print(f"{prefix} {badge:<8} {check_name:<40} {detail}", flush=True)

    def request(self, url: str) -> Tuple[int, bytes, Dict[str, str]]:
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "ALW-Production-Verification/1.0",
                "Accept": "application/json, text/html",
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                status = resp.status
                body = resp.read()
                headers = dict(resp.headers)
                return status, body, headers
        except urllib.error.HTTPError as e:
            return e.code, e.read(), dict(e.headers)
        except Exception as exc:
            return 0, str(exc).encode(), {}

    def test_root_page(self):
        url = f"{self.app_url}/"
        status, body, _ = self.request(url)
        content = body.decode("utf-8", errors="ignore")
        if status in (200, 307, 308) and ("<html" in content.lower() or "<div" in content):
            self.passed += 1
            self.log("PASS", "Root (/) Landing Page", f"HTTP {status} - {len(body)} bytes delivered")
        elif status in (307, 308):
            self.passed += 1
            self.log("PASS", "Root (/) Landing Page", f"HTTP {status} - Auth redirect ok")
        else:
            self.failed += 1
            self.log("FAIL", "Root (/) Landing Page", f"HTTP {status}")

    def test_ai_usage_endpoint(self):
        url = f"{self.app_url}/api/ai/usage"
        status, body, _ = self.request(url)
        if status == 200:
            try:
                data = json.loads(body.decode("utf-8"))
                if data.get("project") == "A-Little-World-With-Us":
                    providers = list(data.get("providers", {}).keys())
                    self.passed += 1
                    self.log("PASS", "AI Status (/api/ai/usage)", f"Project: {data.get('project')}, Providers: {len(providers)}")
                    return
            except json.JSONDecodeError:
                pass
        self.failed += 1
        self.log("FAIL", "AI Status (/api/ai/usage)", f"HTTP {status}")

    def test_telegram_action_route(self):
        url = f"{self.app_url}/api/telegram/action"
        status, body, _ = self.request(url)
        # Should return 405 Method Not Allowed or 400 Bad Request on GET, confirming route is alive
        if status in (200, 400, 405):
            self.passed += 1
            self.log("PASS", "Telegram Route Mount", f"HTTP {status} - Active")
        else:
            self.failed += 1
            self.log("FAIL", "Telegram Route Mount", f"HTTP {status}")

    def test_telegram_connectivity(self):
        token = os.getenv("TELEGRAM_BOT_TOKEN")
        if not token:
            self.log("SKIP", "Telegram Bot Connectivity", "TELEGRAM_BOT_TOKEN not provided in env")
            return

        tg_url = f"https://api.telegram.org/bot{token}/getMe"
        status, body, _ = self.request(tg_url)
        if status == 200:
            try:
                data = json.loads(body.decode("utf-8"))
                if data.get("ok"):
                    bot_name = data.get("result", {}).get("username", "Unknown")
                    self.passed += 1
                    self.log("PASS", "Telegram Bot Connectivity", f"Bot @{bot_name} connected successfully")
                    return
            except json.JSONDecodeError:
                pass
        self.failed += 1
        self.log("FAIL", "Telegram Bot Connectivity", f"HTTP {status}")

    def run_all(self) -> bool:
        print("==================================================================")
        print("  A-LITTLE-WORLD PRODUCTION SMOKE & INTEGRITY VERIFICATION SUITE  ")
        print("==================================================================")
        self.test_root_page()
        self.test_ai_usage_endpoint()
        self.test_telegram_action_route()
        self.test_telegram_connectivity()
        print("------------------------------------------------------------------")
        print(f"Results: {self.passed} PASSED, {self.failed} FAILED")
        print("==================================================================")
        return self.failed == 0


def main():
    parser = argparse.ArgumentParser(description="A-Little-World-With-Us Smoke Test Suite")
    parser.add_argument("--app-url", default=os.getenv("APP_URL", "http://127.0.0.1:3004"))
    parser.add_argument("--timeout", type=int, default=10)
    args = parser.parse_args()

    tester = SmokeTester(args.app_url, args.timeout)
    success = tester.run_all()
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
