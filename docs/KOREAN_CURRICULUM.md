# Korean Learning Curriculum Plan

## Purpose

A Little World With Us will eventually have a serious, long-term Korean learning system rather than a small vocabulary feature. It should combine structured progression with Korean that is useful for real life in Korea and for couple communication.

This curriculum uses the useful organizational idea of paired course units such as 1-1, 1-2, 2-1, 2-2. It is an original curriculum for this app. It must not copy Yonsei or any other school's textbook lessons, dialogues, exercises, images, audio, answer keys, or other protected course content.

## Curriculum architecture

### Track 1 — Our Korean

Our Korean is the learner-facing progression.

| Our Korean | Structured band | Terms | Focus |
|---|---|---|---|
| Level 1 | Beginner | 1-1 / 1-2 | Hangul, pronunciation, greetings, identity, survival phrases |
| Level 2 | Beginner | 2-1 / 2-2 | Daily routines, locations, particles, basic sentence patterns |
| Level 3 | Beginner | 3-1 / 3-2 | Tense, descriptions, requests, plans, everyday conversation |
| Level 4 | Beginner | 4-1 / 4-2 | Connectors, reasons, comparisons, practical situations |
| Level 5 | Beginner → Intermediate bridge | 5-1 / 5-2 | Longer conversations, wider grammar, appointments, work/life basics |
| Level 6 | Intermediate | 6-1 / 6-2 | Natural daily conversation, honorific control, nuance |
| Level 7 | Intermediate | 7-1 / 7-2 | Work, housing, banking, services, social situations |
| Level 8 | Intermediate | 8-1 / 8-2 | Indirect speech, opinions, explanations, longer listening |
| Level 9 | Intermediate | 9-1 / 9-2 | Natural expression, register switching, idioms, cultural nuance |
| Level 10 | Intermediate → Advanced bridge | 10-1 / 10-2 | Sustained conversation, discussion, storytelling, advanced practical communication |

The 1-1 / 1-2 style is an app curriculum convention inspired by common Korean-course organization. It is not a copy of any institution's curriculum.

### Track 2 — Structured Korean

- Beginner = Our Korean Levels 1–5
- Intermediate = Our Korean Levels 6–10
- Future Upper Intermediate and Advanced can be added later without changing existing learner history.

Every level has two terms:
- x-1: foundation and acquisition
- x-2: consolidation, expansion, and practical output

This gives the app a clear 1-1 → 1-2 → 2-1 → 2-2 progression while keeping the main learner-facing level number simple.

### Track 3 — Korea Life

Planned practical modules:
1. Cafe and ordering
2. Restaurants
3. Public transport
4. Shopping and delivery
5. Hospital and pharmacy
6. Appointments and phone calls
7. Banking and payments
8. Housing and utilities
9. Work and workplace communication
10. Government and administrative situations
11. School and education
12. Emergencies and safety
13. Directions and maps
14. Social etiquette and everyday culture

Korea Life lessons should connect to the learner's current Our Korean level so the same situation can be practiced at different difficulty levels.

### Track 4 — Couple Korean

Planned app-specific practice:
- daily couple conversation;
- checking in and asking about feelings;
- making plans;
- affectionate and cute expressions;
- apologies and conflict repair;
- encouragement and support;
- household and life coordination;
- natural casual speech;
- polite speech when appropriate;
- messages and short chat language.

A future phrase view can show meaning, natural Korean, polite form, casual form, affectionate/cute form, and context notes.

## What every level should contain

### Grammar
Core grammar, simple explanations, positive/negative/question forms, tense/aspect, particles, connectors, honorific/formality progression, exceptions, and natural examples.

### Vocabulary
Korean word, English meaning, Burmese meaning where useful, part of speech, example sentence, related forms, pronunciation/audio when available, and review tags.

### Skills
Reading, listening, speaking, writing, vocabulary, grammar, and real-life interaction.

### Practice
Multiple choice, sentence ordering, fill-in-the-blank, listening recognition, translation, Korean typing, short responses, speaking practice when supported, dialogue completion, and review quizzes.

## Level scope

### Beginner — Levels 1–5

Level 1: Hangul, sound rules, greetings, introductions, numbers, time, basic objects, basic copula patterns, and core particles.

Level 2: Daily routines, locations, existence, likes/dislikes, requests, present/past/future foundations, and common counters.

Level 3: Descriptions, comparisons, plans, invitations, reasons, ability, permission, and everyday problem solving.

Level 4: Connected sentences, sequencing, causes/results, experiences, requests and suggestions, shopping, restaurant, and transport dialogues.

Level 5: Longer everyday conversations, wider connector use, practical indirect communication, appointments, work/life basics, and a bridge toward intermediate listening.

### Intermediate — Levels 6–10

Level 6: Natural daily conversation, speech-level switching, honorific foundations, emotional expression, and longer dialogues.

Level 7: Work, housing, banking, appointments, services, social situations, explanations, and problem solving.

Level 8: Indirect speech, reported information, opinions, reasons/evidence, and longer listening/reading.

Level 9: Natural collocations, contractions, discourse markers, nuance, idioms, cultural context, and formal/casual switching.

Level 10: Sustained conversation, discussion, storytelling, persuasion, abstract topics, advanced practical communication, and cumulative review.

The exact grammar and vocabulary sequence must be validated during content authoring. This document defines the architecture, not a claim that all future lessons already exist.

## Curriculum quality rules

1. Original content only.
2. Prioritize language the couple can actually use in Korea.
3. Keep grammar appropriate to the stated level.
4. Recycle important vocabulary and grammar in later levels.
5. Teach natural Korean, not only technically grammatical sentences.
6. Clearly distinguish polite, casual, formal, intimate, and context-specific speech.
7. Explain cultural/contextual reasons when literal translation is misleading.
8. Design content for future audio without making audio mandatory for the initial seed.
9. Keep lesson IDs, vocabulary IDs, progress, quizzes, and completion state compatible between Web and Mobile.
10. Prefer a data-driven shared curriculum rather than separate Web/Mobile content implementations.
11. Use mistakes and review history for future adaptive review.
12. Medical, legal, immigration, finance, and emergency Korea Life content is language/practical guidance, not professional advice.

## Future curriculum data model

Conceptual entities:
- course
- track
- level
- term
- unit
- lesson
- grammar point
- vocabulary
- example sentence
- dialogue
- exercise
- quiz
- audio
- culture note
- user progress
- review item

Stable IDs should let Web and Mobile load the same learning objects and synchronize progress.

## AI role

AI should support the approved curriculum rather than replace it.

Planned capabilities:
- extra practice from approved lesson content;
- level-appropriate grammar explanations;
- Korea Life role-play;
- writing correction;
- natural alternatives;
- couple-specific practice;
- adaptive difficulty;
- weak-area review.

AI-generated content should respect the learner's level and explicitly label advanced grammar when it appears.

## Release order

Korean expansion remains behind core app stabilization.

1. Stabilize Web/Mobile parity and core data flows.
2. Finish production, device, and recovery verification.
3. Finalize the shared Korean curriculum data model.
4. Complete and quality-check Levels 1–3.
5. Build Levels 4–5.
6. Build Levels 6–7.
7. Expand Levels 8–10.
8. Add Korea Life modules.
9. Add Couple Korean modules.
10. Add adaptive review, richer audio, speaking practice, and AI tutoring.

## Relationship to Yonsei

Yonsei-style sub-level organization is useful as a structural reference, especially paired terms such as 1-1 and 1-2. The project must not reproduce Yonsei's proprietary/copyrighted course material.

The intended result is an original curriculum with comparable structural clarity but with:
- couple-centered examples;
- Korea-life situations;
- Burmese-friendly explanations;
- Web/Mobile synchronization;
- app-specific memory/review systems;
- AI-assisted practice.

## Definition of done

A Korean level is not complete just because a level number exists in code.

A level is complete only when it has structured units and lessons, an appropriate grammar sequence, vocabulary and examples, exercises/quizzes, translations, level-appropriate review, Web implementation, Mobile implementation, synchronized data contracts, tests, documentation, and content-quality review.

Until then, a level must be marked planned or in progress rather than complete.
