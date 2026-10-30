---
type: Reference
title: Devpost copy
description: Submission text for the Qloo Agentic Hackathon.
timestamp: 2026-10-31
---

**Tagline:** Find the closest way in before the meeting starts.

## Inspiration

Small talk before a big meeting is usually a guess. Taste data can do better than a shared alma
mater, but only if it is honest about what it knows. Any re-ranking returns an order, so looking
impressive is easy. We wanted a result that had to earn its place.

## What it does

Describe the meeting in a sentence or two. An agent finds each person's tastes on Qloo, looks for
something in their neighbourhood that sits closest to yours, judges whether the result is real, and
tries another kind of thing if it is weak. If your note is missing what it needs, it asks.

## Why Qloo is essential

The doorway is a Qloo result end to end: their neighbourhood, re-ranked by your tastes, then checked
against unrelated control tastes. A language model cannot supply that comparison.

## How we built it

- **Agent:** a Gemini tool loop chooses each step. In a live run it tried TV shows, found the result
  weak, switched to artists and chose those. The server enforces the rules: references must be in
  the note, interests must come from a real search, and an opener must name a real doorway.
- **Qloo:** `/v2/insights` builds the neighbourhood, and `filter.results.entities` re-ranks exactly
  that list. Control seeds test whether a result is specific to you.
- **Reliability:** Gemini 4 Argon reads the note, and Flash models carry routine turns and catch
  rate limits.
- **Stack:** TypeScript, Fastify and React.

## Limits

A doorway means closest among these results. It is not evidence of a shared interest, rapport or a
business outcome. In a test of 8 pairs, 3 passed the control check.
