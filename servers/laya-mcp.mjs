#!/usr/bin/env node
/**
 * Laya MCP Server for Claude Code
 * Local, free System One decision engine (open alternative to TypeSafe Jev)
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { Laya } from "@receptron/laya";

let layaInstance = null;

async function getLaya() {
  if (!layaInstance) {
    console.error("[laya-mcp] Loading Laya model (first run downloads ~1.7GB ONNX weights)...");
    layaInstance = await Laya.load({
      // Default: English checkpoint. For multilingual use:
      // subfolder: "multilingual"
    });
    console.error("[laya-mcp] Laya model ready.");
  }
  return layaInstance;
}

const server = new Server(
  {
    name: "laya",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "laya_system_one",
        description:
          "Full System One evaluation with Laya (local free alternative to TypeSafe Jev). " +
          "Pass a state (text/JSON) and one or more typed questions (choice / score / noul). " +
          "Returns typed answers with calibrated probabilities in a single forward pass.",
        inputSchema: {
          type: "object",
          properties: {
            state: {
              description: "The text, JSON object, or array to evaluate against",
              oneOf: [
                { type: "string" },
                { type: "object" },
                { type: "array" },
              ],
            },
            questions: {
              type: "object",
              description:
                "Map of question_id → question definition. " +
                "Each question must have type ('choice'|'score'|'noul') and instructions. " +
                "choice requires criteria (object of option→description). " +
                "score requires criteria (array of ordered levels). " +
                "noul is a yes/no statement.",
              additionalProperties: {
                type: "object",
                properties: {
                  type: {
                    type: "string",
                    enum: ["choice", "score", "noul"],
                  },
                  instructions: { type: "string" },
                  criteria: {},
                },
                required: ["type", "instructions"],
              },
            },
          },
          required: ["state", "questions"],
        },
      },
      {
        name: "laya_classify",
        description:
          "Quick single-choice decision. Pick exactly one option from a closed set. " +
          "Returns the chosen key + probability distribution.",
        inputSchema: {
          type: "object",
          properties: {
            state: {
              type: "string",
              description: "Context / text to classify",
            },
            instructions: {
              type: "string",
              description: "What decision to make (e.g. 'Which team should handle this?')",
            },
            options: {
              type: "object",
              additionalProperties: { type: "string" },
              description: "Map of option_key → short description of that option",
            },
          },
          required: ["state", "instructions", "options"],
        },
      },
      {
        name: "laya_check",
        description:
          "Yes/No decision with calibrated probability (Noul type). " +
          "Returns P(true) between 0 and 1.",
        inputSchema: {
          type: "object",
          properties: {
            state: {
              type: "string",
              description: "Context / text to evaluate",
            },
            instructions: {
              type: "string",
              description: "The yes/no statement or question (e.g. 'Does this introduce a security risk?')",
            },
          },
          required: ["state", "instructions"],
        },
      },
      {
        name: "laya_score",
        description:
          "Score something on an ordered scale. " +
          "Returns expected score (0-based index) and full probability distribution over levels.",
        inputSchema: {
          type: "object",
          properties: {
            state: {
              type: "string",
              description: "Context / text to score",
            },
            instructions: {
              type: "string",
              description: "What to score (e.g. 'How urgent is this request?')",
            },
            levels: {
              type: "array",
              items: { type: "string" },
              description: "Ordered list of levels from lowest to highest",
            },
          },
          required: ["state", "instructions", "levels"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    const laya = await getLaya();

    if (name === "laya_system_one") {
      const result = await laya.systemOne(args.state, args.questions);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                model: "laya",
                answers: result.answers,
                usage: result.usage || { input_tokens: 0, output_tokens: 0 },
              },
              null,
              2
            ),
          },
        ],
      };
    }

    if (name === "laya_classify") {
      const result = await laya.systemOne(args.state, {
        decision: {
          type: "choice",
          instructions: args.instructions,
          criteria: args.options,
        },
      });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result.answers.decision, null, 2),
          },
        ],
      };
    }

    if (name === "laya_check") {
      const result = await laya.systemOne(args.state, {
        check: {
          type: "noul",
          instructions: args.instructions,
        },
      });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result.answers.check, null, 2),
          },
        ],
      };
    }

    if (name === "laya_score") {
      const result = await laya.systemOne(args.state, {
        score: {
          type: "score",
          instructions: args.levels,
          criteria: args.levels,
        },
      });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result.answers.score, null, 2),
          },
        ],
      };
    }

    return {
      content: [{ type: "text", text: `Unknown tool: ${name}` }],
      isError: true,
    };
  } catch (err) {
    return {
      content: [
        {
          type: "text",
          text: `Laya error: ${err?.message || String(err)}`,
        },
      ],
      isError: true,
    };
  }
});

// Start stdio transport
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("[laya-mcp] Server running on stdio");
