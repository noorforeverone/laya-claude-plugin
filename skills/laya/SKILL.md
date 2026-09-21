---
name: laya
description: Use the local free Laya System One model for fast typed decisions (choice, score, noul) with calibrated probabilities. Prefer Laya over paid APIs or free-text parsing for classification, routing, risk checks, gating, and structured judgments.
---

# Laya – Local System One Decisions

Laya is a **fully local, free, open-source** System One decision model (Apache-2.0).  
It is the open alternative to TypeSafe Jev.

It does **not** generate text.  
You give it a `state` + typed questions → it returns typed answers with calibrated probabilities in a single forward pass (typically 10–150 ms after the model is warm).

## When to use Laya

Reach for the Laya tools whenever you need:

- Classification / routing (which team, which model tier, next action, file type, etc.)
- Yes / No decisions with real confidence (security risk? scope creep? ready to merge?)
- Scoring (urgency, risk, quality, complexity, scope-creep level)
- Gating tool use or deciding whether to escalate to a stronger model
- Any structured judgment where free-text + parsing is slow or unreliable

**Prefer Laya** over asking the main model to “think step by step and answer yes/no” when the decision is closed-set.

## Available tools

| Tool              | Use case                              | Returns                          |
|-------------------|---------------------------------------|----------------------------------|
| `laya_system_one` | Multiple questions about the same state | Full answers object             |
| `laya_classify`   | Single choice from a closed set       | chosen key + probabilities      |
| `laya_check`      | Yes / No with calibrated probability  | P(true)                         |
| `laya_score`      | Ordered scale                         | expected score + distribution   |

## Best practices

1. **Put the full relevant context in `state`**  
   Include the user request, relevant code snippets, diff, error logs, file paths, etc. More signal → better decisions.

2. **Write clear, specific instructions**  
   Bad: “Is this good?”  
   Good: “Does this change introduce a security vulnerability or data-leak risk?”

3. **Keep choice options short and mutually exclusive**  
   Prefer 3–8 options. Very long descriptions hurt accuracy.

4. **Use the probability / confidence**  
   High confidence → auto-act.  
   Medium → proceed with caution.  
   Low → escalate to the main model or ask the user.

5. **Batch questions**  
   When you need several judgments about the same state, use `laya_system_one` once instead of multiple separate calls.

## Example patterns for coding agents

### Route to the right model tier

```json
{
  "state": "",
  "questions": {
    "model_tier": {
      "type": "choice",
      "instructions": "Which model tier is appropriate for this task?",
      "criteria": {
        "cheap": "simple edits, renames, formatting, trivial questions",
        "balanced": "normal feature work, bug fixes, moderate reasoning",
        "smart": "architecture, complex debugging, security-sensitive, multi-file design"
      }
    }
  }
}
```

### Detect scope creep

```json
{
  "state": "",
  "questions": {
    "is_scope_creep": {
      "type": "noul",
      "instructions": "Does the proposed work go significantly beyond the original user request?"
    }
  }
}
```

### Risk / readiness gating

```json
{
  "state": "",
  "questions": {
    "risk": {
      "type": "score",
      "instructions": "How risky is shipping this change?",
      "criteria": ["safe", "low", "medium", "high", "critical"]
    },
    "needs_tests": {
      "type": "noul",
      "instructions": "Does this change require new or updated tests before merging?"
    }
  }
}
```

## Notes

- First call downloads the ONNX model (~1.7 GB). Subsequent calls are fast.
- Model stays in memory for the lifetime of the MCP server process.
- Completely offline after the initial download.
- No API key required.
