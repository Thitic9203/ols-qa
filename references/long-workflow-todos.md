# Long workflow todos

When a Helix skill has **multiple mandatory phases** (e.g. testing-ticket A→F, retest plan→execute→post), use the host’s todo list if available (e.g. TodoWrite in Cursor).

## When to create todos

- Skill defines **3+ phases** with separate user gates, or  
- Session will exceed **~30 minutes** of tool use, or  
- User asked for visible progress.

## Suggested items (examples)

**Testing ticket**

1. Intake + execution plan approved  
2. Preflight YES  
3. Playwright run + evidence captured  
4. Jira draft approved  
5. Post + verify destination  

**Retest**

1. Fix intake + plan approved  
2. Execute checks  
3. Draft comment approved  
4. Post + transition (if requested)  

## Rules

| Rule | Because |
|------|---------|
| One todo = one **user-visible milestone** | Not every micro-step |
| Mark complete only after that phase’s gate passes | [qa-evidence-gates.md](qa-evidence-gates.md) |
| Do not use todos to skip skill text | Todos track progress, not replace procedure |
