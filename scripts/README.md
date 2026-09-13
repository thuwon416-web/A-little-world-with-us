# Relationship memory upload

These scripts upload the cleaned Telegram relationship memories in
`data/FINAL_relationship_memories.json` to the Supabase
`relationship_memories` table. They do not run migrations; apply the SQL
migration manually first.

## Setup

Use Python 3.10 or newer and install the requirements manually:

```bash
python -m pip install -r scripts/requirements.txt
```

Set these values in the local `.env` file:

```dotenv
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
RELATIONSHIP_MEMORIES_COUPLE_ID=your-couple-uuid
```

The service-role key is required because the upload is an administrative
operation. Never commit it or expose it to browser code.

## Validate without uploading

```bash
python scripts/upload_relationship_memories.py --dry-run
```

## Upload

```bash
python scripts/upload_relationship_memories.py
```

The upload is performed in batches of 200 rows by default. Use
`--batch-size` to change that value. The script does not delete existing rows
or deduplicate repeated runs, so review the target table before rerunning it.

## Verify

```bash
python scripts/verify_upload.py
```

The verifier reports the exact number of rows for the configured couple.
