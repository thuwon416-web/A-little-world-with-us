"""Upload cleaned relationship memories to Supabase."""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Any

from dotenv import load_dotenv


REQUIRED_FIELDS = {"category", "date_time"}
OPTIONAL_FIELDS = {
    "sub_category", "quote_burmese", "context", "persons",
    "emotional_tone", "importance", "batch_id",
}


def load_memories(path: Path) -> list[dict[str, Any]]:
    with path.open("r", encoding="utf-8") as file:
        payload = json.load(file)

    memories = payload.get("value") if isinstance(payload, dict) else payload
    if not isinstance(memories, list) or not all(isinstance(item, dict) for item in memories):
        raise ValueError("The data file must contain an array or an object with a 'value' array.")

    for index, memory in enumerate(memories, start=1):
        missing = REQUIRED_FIELDS - memory.keys()
        if missing:
            raise ValueError(f"Entry {index} is missing required fields: {', '.join(sorted(missing))}.")
        if not isinstance(memory.get("persons", []), list):
            raise ValueError(f"Entry {index} has a non-array 'persons' value.")
        unknown = set(memory) - REQUIRED_FIELDS - OPTIONAL_FIELDS
        if unknown:
            raise ValueError(f"Entry {index} contains unsupported fields: {', '.join(sorted(unknown))}.")

    return memories


def build_rows(memories: list[dict[str, Any]], couple_id: str) -> list[dict[str, Any]]:
    rows = []
    for memory in memories:
        row = {
            "couple_id": couple_id,
            "category": memory["category"],
            "sub_category": memory.get("sub_category"),
            "date_time": memory["date_time"],
            "quote_burmese": memory.get("quote_burmese"),
            "context": memory.get("context"),
            "persons": memory.get("persons", []),
            "emotional_tone": memory.get("emotional_tone"),
            "batch_id": memory.get("batch_id"),
        }
        if memory.get("importance") is not None:
            row["importance"] = memory["importance"]
        rows.append(row)
    return rows


def upload(client: Any, rows: list[dict[str, Any]], batch_size: int) -> None:
    for start in range(0, len(rows), batch_size):
        batch = rows[start : start + batch_size]
        client.table("relationship_memories").insert(batch).execute()
        print(f"Uploaded {min(start + batch_size, len(rows))}/{len(rows)} rows.")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data-file", type=Path, default=Path("data/FINAL_relationship_memories.json"))
    parser.add_argument("--dry-run", action="store_true", help="Validate and count rows without uploading.")
    parser.add_argument("--batch-size", type=int, default=200, help="Rows per Supabase request.")
    return parser.parse_args()


def main() -> int:
    load_dotenv()
    args = parse_args()
    if args.batch_size < 1:
        raise ValueError("--batch-size must be greater than zero.")

    data_file = args.data_file.resolve()
    memories = load_memories(data_file)
    couple_id = os.environ.get("RELATIONSHIP_MEMORIES_COUPLE_ID")
    if not couple_id:
        raise ValueError("RELATIONSHIP_MEMORIES_COUPLE_ID is required.")
    rows = build_rows(memories, couple_id)
    print(f"Validated {len(rows)} memories from {data_file}.")

    if args.dry_run:
        print("Dry run complete; no rows were uploaded.")
        return 0

    supabase_url = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    service_role_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not supabase_url or not service_role_key:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for upload.")

    from supabase import create_client

    upload(create_client(supabase_url, service_role_key), rows, args.batch_size)
    print("Upload complete.")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (OSError, ValueError, json.JSONDecodeError) as error:
        print(f"Error: {error}", file=sys.stderr)
        sys.exit(1)
