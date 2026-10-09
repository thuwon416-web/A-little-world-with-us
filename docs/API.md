# API

Owner: Engineering
Update when: route surface, authentication, or external contracts change
Last Updated: 2026-10-09

The current Web Drive surface includes `/api/drive/start`, `/api/drive/callback`, `/api/drive/status`, `/api/drive/upload`, `/api/drive/file`, `/api/drive/delete`, `/api/drive/disconnect`, `/api/drive/sync-memories`, `/api/drive/chat-upload`, and `/api/drive/chat-archive`.

Memory records retain Supabase metadata and provider references such as Drive file identifiers where applicable. Retrieval is part of the contract; upload-only behavior is insufficient.

Protected routes must derive authorization from the authenticated session and enforce couple/ownership rules. Mutating Drive upload, chat upload/archive, B2 URL, and delete endpoints apply same-origin protection. Drive OAuth state is authenticated and host-bound. Memory sync scans only the requested accepted couple under the app-managed `Couples/` tree; user-created folders outside that tree may be imported, while Chat/System/Archive folders are excluded. Daily chat archive writes validate a real calendar date, merge messages by ID, and preserve reply/edit/delivery/seen/media-duration metadata while keeping Drive file IDs as media references. Chat attachment upload accepts allowlisted images/PDFs up to 25 MiB and validates file signatures; Mobile currently keeps its 5 MiB client-side attachment cap.

Before changing a route, inspect callers, authorization, validation, provider interaction, response shape, and tests.