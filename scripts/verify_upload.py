"""Verify relationship-memory rows uploaded to Supabase."""

from __future__ import annotations

import os
import sys

from dotenv import load_dotenv


def get_client():
    load_dotenv()
    url = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.")
    from supabase import create_client

    return create_client(url, key)


def main() -> int:
    load_dotenv()
    couple_id = os.environ.get("RELATIONSHIP_MEMORIES_COUPLE_ID")
    if not couple_id:
        raise ValueError("RELATIONSHIP_MEMORIES_COUPLE_ID is required.")

    response = (
        get_client()
        .table("relationship_memories")
        .select("id", count="exact")
        .eq("couple_id", couple_id)
        .execute()
    )
    if response.count is None:
        raise RuntimeError("Supabase did not return an exact row count.")
    print(f"Verified {response.count} relationship memories for couple {couple_id}.")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (ValueError, RuntimeError) as error:
        print(f"Error: {error}", file=sys.stderr)
        sys.exit(1)
