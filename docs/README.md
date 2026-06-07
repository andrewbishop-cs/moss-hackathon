# PLG Voice AI Agent — Hackathon Project

## One-liner
A voice AI agent that calls warm PLG leads the moment they drop off — with two distinct triggers and scripts depending on where they are in the funnel.

> **Product:** Pump is a tool that cuts companies' **cloud (AWS/GCP/Azure) and AI (OpenAI/Anthropic)** bills. Our agent calls leads who dropped off the Pump funnel.

## Problem
Most PLG companies lose 80–95% of visitors before signup. These aren't cold leads — they expressed intent. Nobody calls them. Email drip is ignored. Voice AI can reach them in real-time with a personalized, context-aware pitch.

## Two Use Cases

### UC1 — New Signup (No Estimate Yet)
Prospect creates an account on the fake Pump site but doesn't run an estimate or trial.
- Agent calls immediately
- References a similar company that uses Pump and what they save
- Offers a Mac Mini if they trial and book a call

### UC2 — Estimate Completed, No Convert
Prospect runs a savings estimate (e.g. finds $13,000/month in savings) but doesn't sign up.
- Agent calls within minutes
- References their exact savings number — personal and real
- "You found $13K/month sitting there for free. Want to actually claim it?"

## Demo Flow (for judges)
1. Show fake Pump website
2. Trigger UC1: create an account → phone rings immediately → live transcript on dashboard
3. Trigger UC2: run estimate → get result → phone rings → agent references exact number
4. Show dashboard: lead queue, live call view, booked meeting outcome

## Hackathon Context
- **Event**: YC Conversational AI Hackathon — June 6–7, 2026
- **Hosted by**: Moss (F25) at YC SF
- **Team**: Paul + Andrew
- **Sponsors**:
  - **LiveKit** — real-time audio/video infra + STT/LLM/TTS via LiveKit Inference (core voice layer)
  - **Moss (F25)** — sub-10ms semantic search / RAG for lead context mid-call
  - **Unsiloed (F25)** — PDF/unstructured doc parsing
  - **AWS** — cloud infra
  - **Qwen** — optional: voice design, cloning, generation (custom agent voice, stretch)
  - **Minimax** — optional: alternate LLM, selectable via LiveKit Inference

## Stack
- **Voice infra**: LiveKit Agents (Python)
- **Telephony**: LiveKit SIP outbound over a **Twilio Elastic SIP trunk** (real PSTN calls)
- **Retrieval / memory**: Moss (sub-10ms semantic search for lead context + script content mid-call)
- **Frontend**: Next.js + React (dashboard + fake Pump website)
- **Backend**: Python (FastAPI)
- **Database**: Supabase
- **Starter repo**: https://github.com/livekit-examples/moss-hacker-starter
