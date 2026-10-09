# API

Owner: Engineering
Update when: route surface, authentication, or external contracts change
Last Updated: 2026-10-09

The current Web Drive surface includes `/api/drive/start`, `/api/drive/callback`, `/api/drive/status`, `/api/drive/upload`, `/api/drive/file`, `/api/drive/delete`, `/api/drive/disconnect`, `/api/drive/sync-memories`, `/api/drive/chat-upload`, and `/api/drive/chat-archive`.

Memory records retain Supabase metadata and provider references such as Drive file identifiers where applicable. Retrieval is part of the contract; upload-only behavior is insufficient.

Protected routes must derive authorization from the authenticated session and enforce couple/ownership rules. Mutating Drive upload, chat upload/archive, B2 URL, and delete endpoints apply same-origin protection. Drive OAuth state is authenticated and host-bound. Memory sync scans only the requested accepted couple under the app-managed `Couples/` tree; user-created folders outside that tree may be imported, while Chat/System/Archive folders are excluded. Daily chat archive writes validate a real calendar date, merge messages by ID, and preserve reply/edit/delivery/seen/media-duration metadata while keeping Drive file IDs as media references. Chat attachment upload accepts allowlisted images/PDFs up to 25 MiB and validates file signatures; Mobile currently keeps its 5 MiB client-side attachment cap.

Before changing a route, inspect callers, authorization, validation, provider interaction, response shape, and tests.
## Drive memory sync ownership behavior

`POST /api/drive/sync-memories` imports images from user-created folders and only traverses the requested accepted couple's folder under the managed `Couples/` tree. It excludes Chat/System/Archive folders and reports `skippedConflicts` when a Drive file ID is already indexed to a different couple, rather than rewriting metadata across couple boundaries.


## Cookie-authenticated mutation protection

Cookie-authenticated AI generation, couple export, feedback submission, and browser push-subscription create/delete endpoints reject cross-origin requests before session lookup. Requests carrying an explicit `Authorization` header continue to be supported for authenticated native/API clients. Route tests cover early rejection for AI Guardian, export, feedback, and push subscription mutations.

The same-origin guard also covers AI chat, journal reflection, Korean quiz generation, voice transcription, Drive memory export, and media upload.


## Mutation-route security inventory (2026-10-09)
All API route handlers that expose `POST`, `PUT`, `PATCH`, or `DELETE` now include an explicit same-origin check, while authenticated native clients using an `Authorization` header remain supported. High-risk storage and export endpoints have focused early-rejection tests.

Memories upload uses Drive first. If the Drive endpoint fails at the provider/server layer (HTTP 5xx), the client attempts Cloudinary and then encrypted Supabase fallback when Cloudinary is unconfigured. It does not bypass authentication, authorization, validation, or rate-limit failures.

Network-level failures in the browser-to-API Drive or Cloudinary upload request also advance to the next provider. Non-5xx validation/auth/authorization/rate-limit responses do not.

Chat attachment upload follows Drive-first storage for supported images/PDFs, then encrypted Supabase fallback when the Drive status lookup fails or the Drive upload endpoint returns HTTP 5xx. Non-5xx upload errors remain hard failures.
