# Korean Learning Curriculum Plan

## Purpose

A Little World With Us will eventually have a serious, long-term Korean learning system rather than a small vocabulary feature. It should combine structured progression with Korean that is useful for real life in Korea and for couple communication.

Yonsei is used as a **level/difficulty benchmark**, not as content to copy. The reference is the Yonsei Korean progression such as 1-1, 1-2, 2-1, 2-2, through the higher numbered books. The app should build an original course at a comparable learner level, with its own lessons, grammar sequencing, vocabulary, dialogues, exercises, examples, audio, and Korea/couple situations.

## Curriculum architecture

### Track 1 — Our Korean

Our Korean is the learner-facing course, but its levels are **mapped against external proficiency benchmarks**. The Yonsei book names are reference points; they are not our lesson names unless we explicitly choose to display an equivalence label.

| Yonsei benchmark | Our Korean target | Structured band | Direction |
|---|---|---|---|
| Yonsei 1-1 | Our Korean — equivalent to 1-1 | Beginner | Match core beginner ability, but write original content |
| Yonsei 1-2 | Our Korean — equivalent to 1-2 | Beginner | Match core beginner ability, but write original content |
| Yonsei 2-1 | Our Korean — equivalent to 2-1 | Beginner | Match the corresponding difficulty/progression |
| Yonsei 2-2 | Our Korean — equivalent to 2-2 | Beginner | Match the corresponding difficulty/progression |
| Yonsei 3-1 | Our Korean — equivalent to 3-1 | Beginner / Intermediate bridge | Validate exact proficiency before locking |
| Yonsei 3-2 | Our Korean — equivalent to 3-2 | Intermediate | Validate exact proficiency before locking |
| Yonsei 4-1 | Our Korean — equivalent to 4-1 | Intermediate | Validate exact proficiency before locking |
| Yonsei 4-2 | Our Korean — equivalent to 4-2 | Intermediate | Validate exact proficiency before locking |
| Yonsei 5-1 | Our Korean — equivalent to 5-1 | Upper-intermediate direction | Validate exact proficiency before locking |
| Yonsei 5-2 | Our Korean — equivalent to 5-2 | Upper-intermediate direction | Validate exact proficiency before locking |
| Yonsei 6-1 | Our Korean — equivalent to 6-1 | Advanced direction | Validate exact proficiency before locking |
| Yonsei 6-2 | Our Korean — equivalent to 6-2 | Advanced direction | Validate exact proficiency before locking |

**Important:** the table defines a benchmarking target, not a claim that the app has already implemented these levels. The exact proficiency mapping above 2-2 must be validated during curriculum research/content design.

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

Yonsei's current official Korean Language Institute page confirms that Level 1 uses 1-1 and 1-2 materials and Level 2 uses 2-1 and 2-2 materials, across vocabulary/grammar, speaking/writing, and listening/reading components. citeturn0search0

For this project, the important idea is **equivalence of learner level**, not copying lessons. We will use Yonsei levels as one external benchmark when deciding whether Our Korean is appropriately difficult. We will create original curriculum content tailored to this app.

The app should eventually be able to communicate an equivalence such as:

- Our Korean ≈ Yonsei 1-1
- Our Korean ≈ Yonsei 1-2
- Our Korean ≈ Yonsei 2-1
- Our Korean ≈ Yonsei 2-2
- and so on after the higher-level benchmarks are researched and validated.

This is especially useful because the user should be able to understand approximately **what level of Korean they can handle**, while the app remains independent in content and pedagogy.

## Definition of done

A Korean level is not complete just because a level number exists in code.

A level is complete only when it has structured units and lessons, an appropriate grammar sequence, vocabulary and examples, exercises/quizzes, translations, level-appropriate review, Web implementation, Mobile implementation, synchronized data contracts, tests, documentation, and content-quality review.

Until then, a level must be marked planned or in progress rather than complete.
