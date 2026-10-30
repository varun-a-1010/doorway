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

Enter a few interests for you and the person you are meeting. Doorway finds something in their taste
neighbourhood that sits closest to yours, plus places, experiences and gifts suited to them.

## Why Qloo is essential

The doorway is a Qloo result end to end: their neighbourhood, re-ranked by your tastes, then checked
against unrelated control tastes. A language model cannot supply that comparison.

## How we built it

`/v2/insights` builds the neighbourhood, and `filter.results.entities` re-ranks exactly that list.
Control seeds test whether a result is specific to you. TypeScript, Fastify and React.

## Limits

A doorway means closest among these results. It is not evidence of a shared interest, rapport or a
business outcome. In a test of 8 pairs, 3 passed the control check.
