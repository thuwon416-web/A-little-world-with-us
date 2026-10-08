# API

Owner: Engineering
Update when: route surface, authentication, or external contracts change
Last Updated: 2026-10-08

The current Web Drive surface includes /api/drive/start, /api/drive/callback, /api/drive/status, /api/drive/upload, /api/drive/file, /api/drive/delete, and /api/drive/disconnect.

Memory records retain Supabase metadata and provider references such as Drive file identifiers where applicable. Retrieval is part of the contract; upload-only behavior is insufficient.

Protected routes must derive authorization from the authenticated session and enforce couple/ownership rules. Drive OAuth state is authenticated and host-bound.

Before changing a route, inspect callers, authorization, validation, provider interaction, response shape, and tests.