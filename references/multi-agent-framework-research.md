# Multi-Agent Framework Decomposition Patterns

**Date**: 2026-04-12
**Purpose**: Research how major multi-agent frameworks approach agent decomposition — deciding what agents to create, how they interact, and when multi-agent is (or isn't) the right call. Informs the design of an "agent needs analysis" tool for Claude Code agent building.

---

## 1. Framework Comparison Table

| Dimension | **CrewAI** | **LangGraph** | **AutoGen / MS Agent Framework** | **OpenAI Swarm → Agents SDK** | **AutoGPT** | **MetaGPT** | **ChatDev** | **Swarms (kyegomez)** |
|---|---|---|---|---|---|---|---|---|
| **Core metaphor** | Team of role-playing employees | Stateful directed graph | Async conversation between agents | Stateless routines + handoffs | Autonomous goal-chasing loop | Software company org chart | Virtual software company | Enterprise swarm orchestration |
| **Agent definition** | `role` + `goal` + `backstory` + tools | Node in a graph with state access | Agent class with system message + tools | System prompt + function list | Goal + memory + tools | Named role (PM, Architect, Engineer, QA) | Named role (CEO, CTO, Programmer, Tester) | Agent class with tools + swarm config |
| **Orchestration model** | Sequential, Hierarchical, or Consensual process | Graph edges define flow; conditional routing | Sequential, Concurrent, Group Chat, Handoff, Orchestrator | Single active agent; explicit handoff functions | Self-prompting loop with reflection | Waterfall pipeline (PRD → Design → Code → Test) | Dialogue-based phase transitions | Sequential, Concurrent, Hierarchical, DAG |
| **How tasks are assigned** | Explicit `Task` objects assigned to agents | State transitions route to agent nodes | Orchestrator delegates or agents self-select in group chat | Triage agent classifies → handoff to specialist | Self-decomposition from high-level goal | Each role produces structured artifacts for the next | Agents communicate through dialogue to advance phases | Tasks assigned via swarm architecture config |
| **State management** | Shared crew context; task outputs chain | Explicit shared state object passed through graph | Shared message history; event-driven async | Stateless — full context passed on each handoff | Vector DB + knowledge graph for long-term memory | Structured documents (PRD, design docs) are the state | Dialogue history is the state | Configurable per architecture |
| **Strengths** | Fast to prototype; intuitive role metaphor; <20 lines for a working system | Maximum control over flow; complex branching; production-grade state | Enterprise features (telemetry, middleware, type safety); async event-driven | Minimal abstraction; easy to understand; transparent handoffs | True autonomy for open-ended goals; strong memory architecture | Structured artifacts reduce hallucination; mirrors real dev teams | Natural dialogue produces creative solutions | Scales to millions of agents; multiple architecture patterns |
| **Weaknesses** | Limited flow control; can't easily do complex branching | Steep learning curve; verbose for simple cases | Complex setup; migration churn (AutoGen → Agent Framework) | No built-in state; context must be manually forwarded; educational only (now deprecated) | Unreliable for production; expensive; hard to constrain | Rigid waterfall; limited to software dev domain | Slow (many dialogue turns); hard to control quality | Less mature; documentation gaps |
| **Best for** | Rapid prototyping; structured team workflows | Complex enterprise workflows; non-linear processes | Enterprise production systems with compliance needs | Learning handoff patterns; simple triage/routing | Research; autonomous exploration tasks | Automated software development | Creative software prototyping | High-throughput distributed processing |
| **Production readiness** | Medium-High | High | High (Agent Framework GA Q1 2026) | Low (deprecated → use Agents SDK) | Low | Medium | Low-Medium | Medium |

### Key Insight
Frameworks converge on the same core primitives despite different metaphors: **agents with scoped instructions and tools**, **structured handoff mechanisms**, and **an orchestration layer that routes work**. The difference is how much control vs. convenience they offer.

---

## 2. Common Agent Archetypes

Across all frameworks, certain role patterns appear repeatedly. These represent the "periodic table" of agent roles.

### Universal Archetypes (appear in 4+ frameworks)

| Archetype | Description | Appears In | When Needed |
|---|---|---|---|
| **Orchestrator / Coordinator** | Decomposes tasks, routes to specialists, aggregates results | CrewAI (Manager), LangGraph (supervisor node), AutoGen (Orchestrator), Hermes (Coordinator), MetaGPT (Project Manager) | Always needed in multi-agent systems; this is the "brain" |
| **Researcher / Information Gatherer** | Searches, retrieves, and synthesizes information from external sources | CrewAI, LangGraph, Hermes, general pattern across all | When the task requires information retrieval, web search, or document analysis |
| **Coder / Developer / Engineer** | Writes, modifies, and executes code | MetaGPT (Engineer), ChatDev (Programmer), Hermes (Developer), AgentMesh (Coder) | When the task involves code generation, modification, or execution |
| **Reviewer / Critic / QA** | Evaluates outputs against criteria; catches errors before they propagate | MetaGPT (QA Engineer), ChatDev (Reviewer/Tester), Hermes (Reviewer), Google (Review & Critique pattern) | When output quality matters; prevents error cascading |
| **Planner / Architect** | Designs high-level approach, breaks problems into sub-problems | MetaGPT (Architect), AgentMesh (Planner), AutoGPT (internal planner) | When tasks are ambiguous or complex enough to need upfront design |
| **Writer / Synthesizer** | Produces final output — reports, documents, summaries | CrewAI (Writer), Hermes (Synthesizer), general pattern | When the deliverable is a document, report, or human-readable output |

### Domain-Specific Archetypes (appear in 2-3 frameworks)

| Archetype | Description | When Needed |
|---|---|---|
| **Triage / Router** | Classifies incoming requests and routes to the right specialist | Customer service, multi-domain systems, API gateways |
| **Validator / Guardrail** | Checks inputs/outputs against rules, schemas, or policies | Compliance, safety-critical systems, data pipelines |
| **Product Manager / Requirements Agent** | Translates user intent into structured requirements | Software development, complex feature work |
| **Browser / Web Agent** | Navigates web interfaces, fills forms, extracts data | Web automation, testing, data collection |
| **Debugger** | Diagnoses and fixes errors in code or workflows | Software development, CI/CD pipelines |
| **Data Analyst** | Processes, transforms, and analyzes structured data | Analytics, reporting, ETL pipelines |

### Anti-Archetype: The "God Agent"
An agent that tries to do everything. Every framework warns against this. Signs: bloated system prompt, too many tools (>10-15), role description longer than a paragraph.

---

## 3. Decomposition Methodologies

How do you go from "I'm building X" to "you need these N agents with these roles"?

### 3.1 Microsoft's Decision Tree (most rigorous)

Microsoft published the most structured decision framework (Cloud Adoption Framework, Dec 2025):

**Start with multi-agent ONLY when:**
1. **Security/compliance boundaries** — regulations mandate data isolation between processing stages
2. **Multiple teams involved** — distinct teams manage separate knowledge domains
3. **Future growth planned** — roadmap includes 3-5+ distinct functions that will expand

**Default to single-agent testing first when:**
1. Clear roles exist (test if persona-switching works before splitting)
2. Rapid time-to-market needed
3. Cost is a priority
4. Large data volumes (fix retrieval before adding agents)
5. High-demand process (measure if parallelization actually helps)
6. Different modalities involved (try multimodal models first)

**Use single-agent when:**
- Well-defined, narrow problem domain
- Operational efficiency matters most

**Key quote**: "Don't assume role separation requires multiple agents. Distinct roles might suggest multiple agents, but they don't automatically justify a multi-agent architecture."

### 3.2 The Functional Decomposition Approach (CrewAI / MetaGPT style)

Map your project to a real-world team structure:

1. **Identify the workflow phases** — What steps does the work go through? (Research → Plan → Build → Test → Deploy)
2. **Assign one agent per phase** — Each phase gets a specialist
3. **Define handoffs** — What does each agent receive and produce?
4. **Add a coordinator** — If >2 agents, add an orchestrator

This is the "software company" metaphor. MetaGPT uses: PM → Architect → Project Manager → Engineer → QA Engineer.

**When it works**: Structured, repeatable workflows with clear phase boundaries.
**When it fails**: Exploratory or iterative work where phases aren't linear.

### 3.3 The Capability-Based Decomposition (LangGraph / AutoGen style)

Decompose by what tools and capabilities are needed:

1. **List all tools/APIs the system needs** — web search, code execution, database access, file I/O, etc.
2. **Group tools by domain** — tools that are used together form a natural agent boundary
3. **Create one agent per tool group** — each agent owns a coherent set of capabilities
4. **Wire routing logic** — build a graph/router that sends tasks to the right agent based on intent

**When it works**: Systems where different tasks need fundamentally different tools.
**When it fails**: When most tasks need the same tools (just give one agent all the tools).

### 3.4 The Scale-Based Heuristic (Iterathon / enterprise pattern)

| Scale | Recommendation | Rationale |
|---|---|---|
| <10K queries/month | Single agent | Team velocity > marginal accuracy gains |
| 10K-100K queries/month | Hybrid (multi-agent for complex paths, single for simple) | 60% time savings on complex tasks justifies overhead |
| 100K+ queries/month | Full multi-agent with LangGraph or similar | 15-30% productivity gains at scale with dedicated ML engineers |

### 3.5 The Context Window Heuristic

When a single agent's context usage exceeds ~60-70%:
- Performance degrades (less headroom for reasoning)
- Splitting into multiple agents at ~40% context each improves quality

But: if agents constantly read each other's output or modify shared files, adding agents creates coordination overhead that exceeds the context savings.

### 3.6 The "Three Nos" Test for Adding an Agent

Before creating a new agent, ask:
1. **Is the main agent's task blocked without this?** → If no, don't add it
2. **Will the system break without it?** → If no, don't add it  
3. **Did the requirements explicitly demand it?** → If no, don't add it

Three "no" answers = keep it in the existing agent.

---

## 4. Interaction Patterns

How agents hand off work to each other. Each pattern has distinct trade-offs.

### 4.1 Orchestrator / Worker (Hub-and-Spoke)

```
         ┌─── Agent A (Research)
         │
Orchestrator ──── Agent B (Code)
         │
         └─── Agent C (Review)
```

| Aspect | Detail |
|---|---|
| **How it works** | Central coordinator receives all tasks, decomposes them, delegates to specialists, aggregates results |
| **Used by** | CrewAI (hierarchical), AutoGen (Orchestrator pattern), LangGraph (supervisor), Google (Coordinator pattern) |
| **Strengths** | Clear control flow; easy to debug; natural escalation path; single point of coordination |
| **Weaknesses** | Orchestrator is a bottleneck; single point of failure; orchestrator prompt becomes complex |
| **Best for** | Most production systems; teams starting with multi-agent; projects where control matters |
| **Scaling limit** | Orchestrator degrades with >5-7 workers (prompt gets too complex) |

### 4.2 Pipeline / Sequential Chain

```
Agent A → Agent B → Agent C → Agent D
(Research)  (Plan)    (Build)   (Review)
```

| Aspect | Detail |
|---|---|
| **How it works** | Each agent passes output to the next in a fixed sequence |
| **Used by** | CrewAI (sequential), MetaGPT (waterfall), Google (Sequential pattern), Swarms (Sequential) |
| **Strengths** | Simple to implement; predictable; easy to test each stage independently |
| **Weaknesses** | Rigid — can't skip steps or branch; slow (no parallelism); error at stage 1 cascades through all |
| **Best for** | Well-defined repeatable processes; document generation; data transformation pipelines |
| **Anti-pattern** | Using pipeline for exploratory/iterative work |

### 4.3 Hierarchical (Tree Structure)

```
           Manager
          /       \
     Lead A      Lead B
     /    \        |
Worker1 Worker2  Worker3
```

| Aspect | Detail |
|---|---|
| **How it works** | Multi-level hierarchy; each level coordinates the level below |
| **Used by** | AutoGen (Hierarchical MARL), Swarms (Hierarchical), Google (Hierarchical Task Decomposition) |
| **Strengths** | Handles very complex tasks; natural task decomposition; mirrors real organizations |
| **Weaknesses** | High latency (decisions traverse tree); expensive (many agents); hard to debug |
| **Best for** | Enterprise-scale (50+ agents); deeply complex problems; multi-domain systems |
| **Key risk** | Communication overhead grows quadratically with depth |

### 4.4 Handoff / Triage (Relay Race)

```
Triage → Agent A (if type X)
       → Agent B (if type Y)
       → Agent C (if type Z)
```

| Aspect | Detail |
|---|---|
| **How it works** | One agent active at a time; explicit handoff transfers full context to next agent |
| **Used by** | OpenAI Swarm/Agents SDK (core pattern), Google (Coordinator pattern) |
| **Strengths** | Minimal overhead; stateless; transparent; easy to test each agent in isolation |
| **Weaknesses** | Context must be manually forwarded; no parallelism; handoff latency adds up |
| **Best for** | Customer service routing; intent-based dispatch; simple classification → specialization |
| **Key insight** | OpenAI advocates this as the default starting pattern |

### 4.5 Peer / Swarm (All-to-All)

```
Agent A ←→ Agent B
  ↕    ╲  ╱    ↕
Agent C ←→ Agent D
```

| Aspect | Detail |
|---|---|
| **How it works** | Every agent can communicate with every other agent; collaborative debate/refinement |
| **Used by** | Google (Swarm pattern), AutoGen (Group Chat), ChatDev (dialogue-based) |
| **Strengths** | Best solution quality through collaborative debate; multiple perspectives |
| **Weaknesses** | Most complex and costly; risk of infinite loops; hard to control convergence |
| **Best for** | Creative brainstorming; product design; adversarial review; problems with no clear decomposition |
| **Key risk** | Without strong termination criteria, agents debate forever |

### 4.6 Review Loop (Generator + Critic)

```
Generator ──→ Critic ──→ (pass? done : revise)
    ↑                         │
    └─────────────────────────┘
```

| Aspect | Detail |
|---|---|
| **How it works** | One agent generates, another evaluates; loop until quality threshold met |
| **Used by** | Google (Review & Critique pattern), MetaGPT (QA step), general pattern |
| **Strengths** | Catches errors; enforces quality; self-correcting |
| **Weaknesses** | Doubles latency and cost; needs clear acceptance criteria or loops forever |
| **Best for** | Code generation; compliance checking; any task where correctness is critical |
| **Max iterations** | Cap at 3-5 iterations to prevent runaway costs |

### Pattern Selection Guide

| Your Situation | Recommended Pattern |
|---|---|
| Simple workflow, <3 agents | Pipeline (Sequential) |
| Need routing/classification first | Handoff / Triage |
| Complex tasks needing coordination | Orchestrator / Worker |
| Quality-critical output | Generator + Critic loop |
| Very complex, multi-domain | Hierarchical |
| Creative / exploratory problems | Peer / Swarm |
| Starting out / unsure | Orchestrator / Worker (safest default) |

---

## 5. Failure Modes

Research from the MAST study (March 2025, 1,642 execution traces), Galileo's 7-failure analysis, and Maxim's reliability research.

### 5.1 Failure Statistics

| Metric | Value | Source |
|---|---|---|
| Coordination breakdowns as % of all failures | 36.9% | MAST study |
| Failures from specification/coordination (not technical) | 79% | MAST study |
| Failure rates across frameworks | 41% - 86.7% | MAST study |
| Multi-agent pilots failing within 6 months | 40% | Industry data |
| Token cost multiplier (single → multi-agent) | 2-5x | Maxim research |
| Agent count where coordination gains plateau | 4 agents | Multiple sources |
| Handoff latency per interaction | 100-500ms | Maxim research |
| Context reconstruction overhead (3 agents) | 29K tokens vs 10K single | Maxim research |

### 5.2 The Seven Deadly Sins of Multi-Agent Systems

| # | Failure Mode | Root Cause | Impact | Mitigation |
|---|---|---|---|---|
| 1 | **Coordination Breakdown** | Agents drift out of sync; role creep; conflicting plans | 36.9% of all failures | Explicit role-aware message schemas; responsibility matrices in prompts; real-time coordination monitors |
| 2 | **Lost Context at Handoffs** | Token limits compress earlier messages; async messages arrive out-of-order | Downstream agents reason from incomplete data | Shared vector DB for full thread retrieval; session IDs; fallback routes replaying known-good states |
| 3 | **Endless Loops** | Missing termination criteria; agents forget prior discussion due to memory limits | Burns tokens and API quotas without progress | Intent classification for unproductive cycles; explicit termination signals; max iteration caps |
| 4 | **Runtime Coordination Failures** | Sequential bottlenecks; race conditions in parallel execution; resource contention | Stalled workflows; exploding costs | Mixture-of-Experts activation; distributed tracing; circuit breakers; auto-scalers |
| 5 | **Cascade Failures** | One agent's error propagates through all downstream agents | 17x error amplification in unstructured systems | Error isolation with sandboxed execution; validate results before broadcasting; graceful degradation with fallback paths |
| 6 | **Role Confusion** | Unclear boundaries; agents duplicate work or assume others are covering gaps | Wasted compute; gaps in coverage; conflicting outputs | Explicit negative constraints ("never do X"); role-validation checkpoints; capability-based tool routing |
| 7 | **Inadequate Observability** | Non-deterministic outputs; parallel execution; opaque orchestration | Bugs appear random; impossible to debug | Correlation IDs; graph views (agents=nodes, messages=edges); conversation replay; regression tests from failures |

### 5.3 The "Bag of Agents" Anti-Pattern

Adding agents without structural design creates what researchers call a "bag of agents" — an unstructured collection where:
- Errors amplify rather than cancel (17x in worst cases)
- Coordination overhead exceeds benefits
- No agent knows what other agents are doing
- The system is harder to debug than a single agent

**The fix**: Arrange agents into **functional planes** (data, reasoning, validation, output) that create closed-loop systems suppressing error amplification.

### 5.4 When NOT to Use Multi-Agent

| Signal | Why |
|---|---|
| You have <10K queries/month | Overhead exceeds benefit |
| All tasks need the same tools | One agent with all tools is simpler |
| Team can't debug the system | Observability overhead is too high |
| Tasks aren't cleanly separable | Agents will constantly need each other's context |
| You're optimizing prematurely | Start single-agent, prove the limitation first |
| The 70% rule applies | For 70% of use cases, a well-prompted single agent delivers equivalent results at 1/3 the cost |

---

## 6. Key Takeaways for Agent Builder

### 6.1 Design Principles for a "What Agents Do You Need?" Tool

Based on patterns across all frameworks, an agent needs analysis should follow this decision flow:

```
1. START: Can a single agent do this?
   ├── YES → Use single agent with persona switching
   └── MAYBE/NO → Continue

2. WHY do you need multiple agents?
   ├── Security/compliance boundaries → Mandatory split (Microsoft criterion)
   ├── Different teams/domains → Split by team ownership
   ├── Context window pressure → Split by workflow phase
   ├── Different toolsets needed → Split by capability group
   └── Quality requires review → Add critic/reviewer agent

3. HOW MANY agents?
   ├── Start with the minimum (2-3)
   ├── Gains plateau at 4 agents for most tasks
   ├── Never exceed what you can debug
   └── Each agent must justify its existence

4. WHAT PATTERN?
   ├── Simple linear workflow → Pipeline
   ├── Need routing/triage → Handoff pattern
   ├── Complex coordination → Orchestrator + Workers
   ├── Quality-critical → Generator + Critic
   └── Unsure → Default to Orchestrator + Workers

5. VALIDATE: For each agent, confirm:
   ├── Has a clear, non-overlapping role
   ├── Has a scoped tool set (not >10-15 tools)
   ├── Has defined inputs and outputs
   ├── Can be tested independently
   └── Has explicit handoff criteria (when to pass work)
```

### 6.2 The Agent Decomposition Questionnaire

Questions to ask when helping a user decide what agents they need:

| # | Question | What It Reveals |
|---|---|---|
| 1 | What are the distinct phases of your workflow? | Pipeline candidates |
| 2 | Does any phase require fundamentally different tools? | Capability-based split candidates |
| 3 | Do different phases need different security/data access? | Mandatory split boundaries |
| 4 | Which phases could run in parallel vs. must be sequential? | Architecture pattern selection |
| 5 | Where do errors matter most? What needs review before proceeding? | Where to add critic/reviewer agents |
| 6 | How much data/context does each phase need? | Context window pressure points |
| 7 | Will different people/teams maintain different parts? | Organizational split candidates |
| 8 | What's the volume? (<1K, 1K-100K, >100K tasks/month) | Single vs. multi-agent threshold |
| 9 | What's the acceptable latency? | Constrains agent count and depth |
| 10 | Can you describe the happy path in 3-5 steps? | If yes → pipeline. If no → may need orchestrator |

### 6.3 Mapping to Claude Code Agent Design

How these patterns translate to the Claude Code `.claude/agents/` structure:

| Framework Pattern | Claude Code Equivalent | Implementation |
|---|---|---|
| Orchestrator | Main Claude Code session | The user's primary agent that delegates |
| Specialist Worker | `.claude/agents/<domain>/agent.md` | Sub-agent with scoped instructions + tools |
| Pipeline | Sequential sub-agent calls | Agent A output feeds Agent B input |
| Critic / Reviewer | QA agent with verification instructions | Agent that runs tests and reviews diffs |
| Triage / Router | Instructions in main agent to detect task type | Main agent decides which sub-agent to call |
| Shared State | `session-docs/`, project files | Agents communicate through files, not messages |

### 6.4 The Minimum Viable Agent Set

For a typical software development project, the research suggests this minimal set:

| Agent | Maps To | Why It Exists |
|---|---|---|
| **Orchestrator** | Main session | Routes tasks, maintains context, handles git/session docs |
| **Frontend Specialist** | `agents/frontend/` | Scoped to UI tools, design patterns, component library |
| **Backend Specialist** | `agents/backend/` | Scoped to API, database, server-side logic |
| **QA/Review** | `agents/qa/` | Runs tests, reviews diffs, validates before commit |
| **Research** | `agents/research/` | Web search, documentation lookup, competitive analysis |

Add more only when:
- A specialist is consistently overwhelmed (context pressure)
- A new domain enters the project (e.g., mobile, infrastructure, ML)
- Compliance requires separation

### 6.5 Rules of Thumb (Distilled from All Sources)

1. **Start single, split when proven necessary.** 70% of use cases don't need multi-agent.
2. **4 is the magic number.** Benefits plateau beyond 4 agents for most tasks.
3. **Orchestrator + Workers is the safest default pattern.** When in doubt, use it.
4. **Every agent needs a "never do" list.** Preventing role creep is more important than defining responsibilities.
5. **Handoffs must carry full context.** Stateless handoffs require explicit context forwarding.
6. **Cap review loops at 3-5 iterations.** Unbounded loops are the #1 cost explosion.
7. **Test agents individually before composing.** A broken agent will cascade 17x through the system.
8. **Coordination overhead scales quadratically.** 5 agents = manageable. 50 agents = dedicated infrastructure.
9. **79% of failures are specification problems, not code problems.** Invest in clear agent definitions.
10. **The removal test applies to agents too.** If removing an agent doesn't break anything, remove it.

---

## Sources

### Frameworks & Documentation
- [CrewAI Tasks Documentation](https://docs.crewai.com/en/concepts/tasks)
- [CrewAI GitHub Repository](https://github.com/crewaiinc/crewai)
- [LangGraph Multi-Agent Systems Tutorial](https://latenode.com/blog/ai-frameworks-technical-infrastructure/langgraph-multi-agent-orchestration/langgraph-multi-agent-systems-complete-tutorial-examples)
- [LangGraph Workflows and Agents Docs](https://docs.langchain.com/oss/python/langgraph/workflows-agents)
- [Microsoft Agent Framework Overview](https://learn.microsoft.com/en-us/agent-framework/overview/)
- [AutoGen to Microsoft Agent Framework Migration](https://learn.microsoft.com/en-us/agent-framework/migration-guide/from-autogen/)
- [OpenAI Swarm GitHub](https://github.com/openai/swarm)
- [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/)
- [Swarms Framework (kyegomez)](https://github.com/kyegomez/swarms)
- [Claude Agent SDK Overview](https://code.claude.com/docs/en/agent-sdk/overview)
- [Building Agents with Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk)

### Research & Analysis
- [Google Cloud: Choose a Design Pattern for Agentic AI](https://docs.cloud.google.com/architecture/choose-design-pattern-agentic-ai-system)
- [Microsoft: Single vs Multi-Agent Decision Framework](https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ai-agents/single-agent-multiple-agents)
- [Taxonomy of Hierarchical Multi-Agent Systems](https://arxiv.org/html/2508.12683)
- [AgentMesh: Cooperative Multi-Agent Framework](https://arxiv.org/html/2507.19902v1)
- [Agentic AI Architectures, Taxonomies, and Evaluation](https://arxiv.org/html/2601.12560v1)
- [AI Agents vs Agentic AI: Conceptual Taxonomy](https://arxiv.org/html/2505.10468v4)

### Failure Modes & Anti-Patterns
- [Why Multi-Agent Systems Fail: 17x Error Trap (Towards Data Science)](https://towardsdatascience.com/why-your-multi-agent-system-is-failing-escaping-the-17x-error-trap-of-the-bag-of-agents/)
- [The Multi-Agent Trap (Towards Data Science)](https://towardsdatascience.com/the-multi-agent-trap/)
- [Multi-Agent System Reliability: Failure Patterns (Maxim)](https://www.getmaxim.ai/articles/multi-agent-system-reliability-failure-patterns-root-causes-and-production-validation-strategies/)
- [7 Reasons Multi-Agent Systems Fail (Galileo)](https://galileo.ai/blog/why-multi-agent-systems-fail)
- [Why Multi-Agent LLM Systems Fail (orq.ai)](https://orq.ai/blog/why-do-multi-agent-llm-systems-fail)
- [Multi-Agent Orchestration Failure Playbook 2026 (Cogent)](https://cogentinfo.com/resources/when-ai-agents-collide-multi-agent-orchestration-failure-playbook-for-2026)

### Comparisons & Guides
- [LangGraph vs CrewAI vs AutoGen Comparison 2026](https://devops.gheware.com/blog/posts/langgraph-vs-crewai-vs-autogen-comparison-2026.html)
- [Multi-Agent Frameworks for Enterprise 2026 (adopt.ai)](https://www.adopt.ai/blog/multi-agent-frameworks)
- [Best Multi-Agent Frameworks 2026](https://gurusup.com/blog/best-multi-agent-frameworks-2026)
- [State of AI Agent Frameworks 2026 (Fordel Studios)](https://fordelstudios.com/research/state-of-ai-agent-frameworks-2026)
- [Multi-Agent Orchestration Economics 2026](https://iterathon.tech/blog/multi-agent-orchestration-economics-single-vs-multi-2026)
- [Single vs Multi-Agent Architecture 2026 Guide](https://www.innervationai.com/blog/single-vs-multi-agent-architecture-2026-guide/)
- [OpenAI Swarm Framework Guide (Galileo)](https://galileo.ai/blog/openai-swarm-framework-multi-agents)
- [CrewAI Multi-Agent Workflow Guide 2026](https://qubittool.com/blog/crewai-multi-agent-workflow-guide)
- [Hermes Agent Multi-Agent Architecture Proposal](https://github.com/NousResearch/hermes-agent/issues/344)
- [MetaGPT: What is MetaGPT (IBM)](https://www.ibm.com/think/topics/metagpt)
- [ChatDev: What is ChatDev (IBM)](https://www.ibm.com/think/topics/chatdev)
