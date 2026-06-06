# PLG Voice AI Agent — Hackathon Project

## One-liner
A voice AI agent that calls warm, high-intent PLG leads who visited a SaaS tool but didn't convert — and offers them an incentive (e.g. a Mac Mini) to trial the product and book a call.

## Problem
Most PLG companies lose 80–95% of visitors before signup. These aren't cold leads — they expressed intent. Nobody calls them. Email drip is ignored. Voice AI can reach them in real-time with a personalized pitch.

## Solution
Automated outbound voice calls triggered by high-intent funnel drop-off events. The agent:
1. Introduces itself and the product
2. References what the lead did (e.g. "you started a savings estimate")
3. Makes a concrete offer (trial incentive)
4. Qualifies them and books a human follow-up call

## Hackathon Context
- **Event**: YC Conversational AI Hackathon — June 6–7, 2026
- **Hosted by**: Moss (F25) at YC SF
- **Team**: Paul + Andrew
- **Sponsors**:
  - **LiveKit** — real-time audio/video infra (core voice layer)
  - **Moss (F25)** — sub-10ms semantic search / RAG for lead context mid-call
  - **TrueFoundry** — AI gateway to control & scale agents
  - **Unsiloed (F25)** — PDF/unstructured doc parsing (could ingest lead docs, contracts, etc.)
  - **AWS** — cloud infra
  - **Minimax** — LLM
  - **Qwen** — voice design, cloning, generation (custom agent voice)

## Stack
- **Voice infra**: LiveKit Agents (Python)
- **Retrieval / memory**: Moss (sub-10ms semantic search for lead context mid-call)
- **Frontend / dashboard**: Next.js + React
- **Backend**: Python (FastAPI)
- **Lead data**: Mock CRM/DB for demo; enrichment via Clay in production
- **Starter repo**: https://github.com/livekit-examples/moss-hacker-starter
