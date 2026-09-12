# Contributing Guide

## Before opening a pull request

1. Create a focused feature branch.
2. Inspect existing routes, services, and schema before changing contracts.
3. Keep user data scoped to the authenticated user or accepted couple.
4. Run the relevant typecheck and lint commands.
5. Run the web build when web routes or shared UI change.

## Code style

- TypeScript strict mode
- Existing ESLint and Prettier configuration
- Component-based architecture
- Prefer typed services and schema-verified Supabase queries
- Avoid logging private chat, health, finance, location, vault, or AI context

## Commit messages

Use conventional prefixes such as `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, and `chore:`.

## Pull requests

Describe the behavior change, affected web/native surfaces, schema assumptions, validation commands, and any manual test limitations.
