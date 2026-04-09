OpenAlmanac is a knowledge base for curious people. It's a place where anyone can come to explore topics, go down rabbit holes with AI, and share what they learn as detailed, sourced, linked articles. Think Wikipedia's depth + Reddit's community energy + AI-powered research.

Three modes: **Discover** (browse articles, communities, stubs), **Explore** (AI-powered deep research with images and entity links), **Contribute** (articles emerge from exploration and feed back into the ecosystem). The conversation is the product — articles are the lasting output.

The platform has three surfaces: a Next.js **web frontend** (reading, browsing, communities), an Electron **desktop app** (full AI exploration + everything the web has), and an **MCP server/API** (agent access for any tool).

Read VISION.md for the full product vision and philosophy.

## Codebase map

| Directory | What it is | Key files | Own CLAUDE.md |
|-----------|-----------|-----------|---------------|
| `frontend/` | Next.js App Router web frontend — reading, browsing, communities, profiles, article editing | `src/app/` (pages), `src/components/` (UI), `src/lib/` (API client, utils), `src/hooks/` | Yes — read it before editing frontend code |
| `backend/` | Python/FastAPI API server — articles, search, communities, research proxy, auth | `src/api/v1/` (routers), `src/schemas/` (Pydantic models), `src/services/` (business logic), `src/models/` (DB models) | Yes — read it before editing backend code |
| `gui/` | Electron desktop app — AI exploration, Quill, browse, communities, profiles | `main.js` (Electron main process + IPC), `src/views/` (pages), `src/components/` (UI), `src/hooks/` (state), `config.js` (shared tool config) | Yes — read it before editing GUI code |
| `mcp-ts/` | TypeScript MCP server published to npm as `openalmanac` — tools for agents to read/write the knowledge base | `src/tools/` (tool definitions), `src/server.ts` (instructions), `src/auth.ts` (API key + request helper) | No |
| `skills/` | Agent skill files served at `/llms.txt` | `openalmanac/SKILL.md` (the API contract) | No |
| `docs/` | Implementation plans and design docs | `plans/` (dated plan files) | No |

**Start here:** Read this file + VISION.md for product context. Then read the CLAUDE.md in whichever directory you're editing — they have detailed engineering principles, tooling, and patterns specific to that layer.

**Before brainstorming:** Read `docs/research/curiosity-and-contribution.md` — our synthesis of the psychology of curiosity, why people contribute to open knowledge platforms, and what kills contribution. This is the foundational understanding of how humans operate that should inform all product decisions.

## How we work

### Use agents liberally

Work happens in parallel. When there are independent tasks, spin up multiple subagents simultaneously — don't do things one at a time. Group by independence, not size.

**Available agents** (in `.claude/agents/`):

| Agent | When to use | Model |
|-------|-------------|-------|
| **review** | After completing features, before merging, or when you want a critical eye on code quality and structure. Suggests bold restructuring, not just bug fixes. | sonnet |
| **critic** | Before committing to an approach. Stress-tests plans, finds weaknesses, argues for better alternatives. Use when a design decision isn't obvious. | opus |
| **pair** | When stuck, designing something, or wanting a second brain. Explores the codebase with you, thinks out loud, helps work through problems collaboratively. | opus |
| **security** | Before deploying, after adding auth/input handling, or for periodic audits. Audits for injection, auth bypasses, data exposure, OWASP top 10. | opus |
| **commentor** | After building, before review. Adds "huh?" comments to code and captures product/architecture decisions in CLAUDE.md. Include a decisions brief from the conversation. | sonnet |
| **codex-review** | Same review standards as the review agent, but run through Codex for a second-model perspective. Use alongside regular review for important changes. | sonnet |
| **error-flows** | Walks through a feature as the user and finds every roadblock — dead ends, missing feedback, confusing states. Use before or after building to stress-test. | opus |

You also have the built-in **Explore** agent (fast codebase exploration), and can spin up **general-purpose** subagents for any independent task.

Use `SendMessage` to continue conversations with agents that already have context rather than starting fresh.

### Commentor pass — after building, before review

After implementation, before spinning up review agents, run the **commentor** agent. It does two things:

1. Adds code comments where a future reader would go "huh?"
2. Captures product/architecture decisions in the relevant CLAUDE.md's `## Design decisions` section

When you spin it up, include a **decisions brief** in the prompt: the key product decisions, architecture choices, constraints, what was considered and rejected, and why. The commentor uses this to place the right explanation at the right spot — both in code and in CLAUDE.md.

The flow is: **build → commentor pass → review → fix → review until clean.**

### Code review is a habit, not a gate

- **After every meaningful batch of work**, proactively suggest spinning up review agents. Don't wait to be asked.
- **Split reviews by layer** — frontend components, hooks/state, views, backend, MCP, security. Each reviewer should be thorough on their slice.
- **Fix what reviews find immediately.** Don't triage into a backlog. The cycle is: build → review → fix → review until clean.
- **Writing code is cheap.** The standard is quality and maintainability. Big refactors, renames, restructuring, decomposition — all welcome when they improve the code.

### Log what you build in the GUI

When adding or modifying GUI main process code, add structured logging using the `log.child()` API from `main/logger.js`. See `gui/CLAUDE.md` → Logging for the full API, namespaces, and how to read logs.

### Be proactive

- Suggest code reviews after significant changes
- Point out when something touches a sync contract (SKILL.md, MCP tools)
- Notice when components are getting too large and suggest decomposition
- Flag security implications without being asked
- Suggest spinning up a critic or pair agent when the design isn't obvious
- Explore the codebase before building — understand what exists before creating something new

### Explore before building

For design decisions, talk it through first. Not a long planning doc — a quick conversation about tradeoffs. Use the pair agent or critic agent for a second opinion. Then build.

## Design decisions

_Product-level and cross-cutting architectural choices. One-liners explaining why, not what. Updated by the commentor agent or during conversations._

- **Store facts separately and derive product meaning centrally.** Session state, provider auth, profile data, process state, and local drafts each own their own truth; `ready`, `nextStep`, badges, and CTA state should be computed from those facts, not stored as competing booleans.
- **Do not let convenience hooks become shadow state machines.** The moment one hook/store starts mixing raw facts, derived meaning, routing, and UI fallbacks, bugs turn into precedence rules; split those responsibilities back apart instead.
- **Most consumers should receive the simplified answer, not raw subsystem state.** Specialized surfaces can inspect low-level facts, but the rest of the app should consume a derived summary like “what is this entity now?” or “can this user enter the app?”
- **Recompute gating state from current facts instead of persisting progress unless the product truly needs resumable drafts.** This keeps restart, sign-out, and cross-surface transitions honest without inventing extra onboarding or readiness state.
- **Use top-level modes only for real product states.** `login`, `setup`, and `app` are valid modes; repurposing arbitrary screens as onboarding steps creates UI confusion and spreads state logic across the tree.
- **Async state coordination is part of correctness, not polish.** When state is refreshed concurrently, stale results must be ignored or cancelled so old truth cannot overwrite new truth.

## Sync rules

These files are contracts with external consumers. When reality changes, they MUST be updated or things break silently.

- **`skills/openalmanac/SKILL.md`** — Agent-facing API contract served at `/llms.txt`. Any change to API endpoints, authentication, validation, response shapes, or content rules must be reflected here.
- **`mcp-ts/src/`** — MCP server published to npm. Any change to API endpoints, request/response shapes, or tool behavior must be reflected in the MCP tool definitions.

## Database

PostgreSQL hosted on Supabase. Run migration scripts from the `backend/` directory:

```bash
cd backend && doppler run -- bash -c 'psql "$DATABASE_URL" -f scripts/<migration>.sql'
```
