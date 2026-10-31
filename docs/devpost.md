---
type: Reference
title: Devpost copy
description: Submission text for the Qloo Agentic Hackathon.
timestamp: 2026-10-31
---

**Tagline:** Small talk, but with evidence.

## Inspiration

You have an important meeting in twenty minutes, and all you know about this person is that they love the Knicks. You know nothing about the Knicks. You could fake it. You could look up one statistic and deploy it casually, and for about forty seconds this would go well. Then they would ask a follow-up question, and you would be exposed as a fraud in front of a plate of bruschetta.

Doorway is for everyone who has ever said "how about that game" with no knowledge of which game. It finds something real near their taste that is also close to yours, so you can walk in honestly curious. No pretending to be a fan.

## What it does

Describe the meeting in a sentence or two. An agent finds each person's tastes on Qloo, looks through their neighbourhood for whatever sits closest to yours, judges whether that result is real, and tries a different kind of thing if it's weak. You get a few doorways, each with an opener you could say out loud, and a list of poor places to start. If your note is missing what it needs, it asks.

## Why Qloo is essential

Any re-ranking returns an order, which means looking impressive is free. The doorway is a Qloo result from end to end: their taste neighbourhood, re-ranked by your tastes, then checked against unrelated control tastes to see whether it means anything. A language model can write a charming icebreaker, but it can't produce that comparison. It can only sound like it did.

## How we built it

- **Agent:** a Gemini tool loop plans its own route. It pulls tastes out of a messy note, resolves each one on Qloo, retries spellings, drops what it can't place, builds a brief, reads the verdict, and changes direction. In one live run it tried TV shows, found the result weak, switched to artists and chose those.
- **Guardrails:** the server enforces what the model can't talk its way around. References must appear in the note, interests must come from a real search in that same run, and an opener may only use the doorway's name and Qloo's returned tags. It can never claim you share an interest. Runs are capped at 12 turns, 10 searches and 3 briefs.
- **Qloo:** `/v2/insights` builds a neighbourhood of 24 items from their tastes. `filter.results.entities` then re-ranks exactly that list against yours.
- **Control check:** the same list is re-ranked for unrelated seeds. If a result rises for random tastes too, it's simply popular, and it's marked "Also near generic picks" instead of "Specific to your taste."
- **Reliability:** Gemini 4 Argon reads the note and Flash models carry the routine turns. A failed call tries the same model on a second Vertex project, then the rest of the chain. Tool state survives the switch, which we tested by forcing failures mid-run.
- **Stack:** TypeScript, Fastify and React, and manual entry keeps working with no LLM at all.

## Challenges

Our hardest job was not getting results. It was refusing to oversell them. An app like this can produce a beautiful answer for literally any two people, and that is exactly the problem. So we built the control check that embarrasses us. In a test of 8 pairs, only 3 passed, and we left that number here on purpose.

## What's next

Calendar integration, so your prep lands before the meeting, and memory of what worked with each person.

## Limits

A doorway means closest among these results. It is not evidence of a shared interest, rapport or a business outcome. If you still end up in a conversation about the pick-and-roll, you're on your own.
