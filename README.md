# 🌿 Greenscape AI

AI-powered business operating system for Greenscape — a premium landscape & hardscape design-build company in Phoenix, AZ.

![React](https://img.shields.io/badge/React-19-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Convex](https://img.shields.io/badge/Convex-Realtime-orange) ![Tailwind](https://img.shields.io/badge/Tailwind-v4-cyan) ![Vercel](https://img.shields.io/badge/Deployed-Vercel-black)

## Live Demo

🔗 **[greenscape-ai-navy.vercel.app](https://greenscape-ai-navy.vercel.app)**

## What It Does

Greenscape AI streamlines the entire client lifecycle — from lead capture to project completion:

- **AI Lead Qualification** — Score and qualify incoming leads automatically
- **AI Proposal Generator** — Site walk notes → professional proposal with line items in 60 seconds
- **Project Tracker** — Post-sign checklist, crew assignment, phase tracking
- **Client Updates** — One-click branded email updates to clients
- **Approval Queue** — Change orders, add-ons, and decisions in one place
- **Integrations** — GoHighLevel CRM sync, Slack team notifications, Resend email

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Tailwind CSS v4, shadcn/ui |
| Backend | Convex (real-time database, serverless functions) |
| Auth | Convex Auth (email/password) |
| AI | OpenAI GPT-4o (proposals, lead qualification, updates) |
| Email | Resend API |
| CRM | GoHighLevel API |
| Notifications | Slack Incoming Webhooks |
| Hosting | Vercel |

## Project Structure

```
greenscape-ai/
├── src/
│   ├── pages/           # Dashboard, Leads, Proposals, Projects, etc.
│   ├── components/      # Sidebar, UI components (shadcn/ui)
│   └── lib/             # Utilities, markdown renderer
├── convex/
│   ├── schema.ts        # Database schema
│   ├── ai.ts            # AI proposal & qualification logic
│   ├── integrations.ts  # GHL, Slack, Email integrations
│   ├── settings.ts      # App configuration storage
│   ├── leads.ts         # Lead management
│   ├── proposals.ts     # Proposal CRUD
│   ├── projects.ts      # Project tracking
│   └── http.ts          # Webhook endpoints
└── public/              # Static assets
```

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (or Node.js 18+)
- [Convex account](https://convex.dev/)

### Installation

```bash
# Clone the repo
git clone https://github.com/MohdNematullah/greenscape-ai.git
cd greenscape-ai

# Install dependencies
bun install

# Start Convex backend
bunx convex dev

# Start frontend (in another terminal)
bun run dev
```

### Environment Setup

Add these to your Convex dashboard (Settings → Environment Variables):

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | OpenAI API key for AI features |
| `RESEND_API_KEY` | No | Resend API key for email sending |
| `FROM_EMAIL` | No | Sender email (default: `onboarding@resend.dev`) |
| `GHL_API_KEY` | No | GoHighLevel API key |
| `GHL_LOCATION_ID` | No | GHL sub-account ID |
| `SLACK_WEBHOOK_URL` | No | Slack Incoming Webhook for notifications |

You can also configure these from the app's **Settings** page after logging in.

## Features

### AI Proposal Generator
Paste site walk notes → AI generates a complete proposal with scope, line items, pricing, and timeline. Uses real Phoenix-market rates from 55+ pricing items.

### Lead Pipeline
Track leads from first contact through qualification, site walk, proposal, and close. AI scoring helps prioritize the best opportunities.

### Project Management
Post-sign workflow with checklist tracking: deposit, HOA, permits, crew scheduling, progress milestones, and final walkthrough.

### One-Click Email
Send branded proposals and client updates via email. Auto-captures client email from lead records.

### Integrations
- **GoHighLevel**: Import contacts, sync pipeline data
- **Slack**: Real-time team notifications for 8 event types
- **Email**: Branded transactional emails via Resend

## License

MIT

---

Built for Greenscape · Phoenix, AZ 🌵
