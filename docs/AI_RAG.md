# AI / RAG

Owner: AI Engineering
Update when: provider adapters, feature profiles, prompts, retrieval, or model routing change
Last Updated: 2026-10-08

The Web AI layer uses provider adapters with feature-specific allowlists/fallback profiles. Audited providers include Groq, Gemini, OpenRouter, Mistral, Cohere, Cerebras, NVIDIA, Hugging Face, and Cloudflare where configured.

Profiles include chat, Korean, relationship writing, planning, safety reflection, and embeddings/reranking. Fallback order is constrained by feature profile.

AI routes must authenticate/authorize private relationship data, validate inputs, bound output/token usage, and resist prompt/tool abuse and cross-user leakage.

Embeddings/reranking are separate from chat generation. Provider availability and credentials remain configuration-dependent.