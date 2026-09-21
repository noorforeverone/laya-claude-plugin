# Laya – Claude Code Plugin

**Local, free System One decision model for Claude Code.**

Open-source alternative to TypeSafe Jev.  
Fast typed decisions (Choice / Score / Noul) with calibrated probabilities — fully offline after the first download.

---

## Features

- Complete MCP server (`laya_system_one`, `laya_classify`, `laya_check`, `laya_score`)
- Official-style Skill that teaches Claude Code when and how to use Laya
- Zero API cost, fully local
- Compatible with Claude Code plugin marketplace

---

## Requirements

- Node.js **20+**
- ~2 GB free disk space (model weights)
- ~2–3 GB RAM while the model is loaded

---

## Installation

### Option 1 – Marketplace (recommended)

```bash
# Add this repository as a marketplace
claude plugin marketplace add noorforeverone/laya-claude-plugin

# Install the plugin
claude plugin install laya@noorforeverone
```

### Option 2 – Local plugin directory

```bash
git clone https://github.com/noorforeverone/laya-claude-plugin.git
cd laya-claude-plugin
npm install

# Use in any Claude Code session
claude --plugin-dir $(pwd)
```

Or permanently:

```bash
# Move to a stable location
mv laya-claude-plugin ~/claude-plugins/laya

# Then start Claude Code with
claude --plugin-dir ~/claude-plugins/laya
```

### First Run

The first time any Laya tool is called, the MCP server downloads the ONNX model weights (~1.7 GB) from Hugging Face and caches them under `~/.cache/laya` (or the path set in `LAYA_CACHE`).

Subsequent calls are fast (typically 10–150 ms after warm-up).

## Available Tools

| Tool | Purpose |
|---|---|
| `laya_system_one` | Full multi-question System One call |
| `laya_classify` | Single choice from a closed set |
| `laya_check` | Yes/No with calibrated probability (Noul) |
| `laya_score` | Ordered scale scoring |

## Skill

The plugin includes a Skill (`skills/laya/SKILL.md`) that teaches Claude Code:

- When to prefer Laya over free-text reasoning
- Best practices for writing good questions
- Common coding-agent patterns (model routing, scope-creep detection, risk gating, etc.)

Claude will automatically load the skill when relevant.

## Model Variants

By default the plugin uses the English checkpoint.

To switch to the multilingual (faster) checkpoint, edit `servers/laya-mcp.mjs` and change:

```js
layaInstance = await Laya.load({
  subfolder: "multilingual",
});
```

## License

- Plugin code: MIT
- Laya model weights: Apache-2.0 (by Convai Innovations)

## Credits

- Laya / convaiinnovations/laya by Nandakishor Mukkunnoth
- `@receptron/laya` – Node.js / ONNX runtime
- TypeSafe Jev – inspiration for the System One interface
