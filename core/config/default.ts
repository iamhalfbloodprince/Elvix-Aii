import { ConfigYaml } from "@continuedev/config-yaml";

export function getDefaultConfig(): ConfigYaml {
  return {
    models: [
      {
        title: "ELVIX Local",
        provider: "elvix-local",
        model: "llama3.1:8b",
        systemMessage: "You are ELVIX AI, an advanced code assistant that helps developers write better code. You have access to powerful local models that ensure privacy and performance.",
      },
      {
        title: "ELVIX Code Completion",
        provider: "elvix-local", 
        model: "qwen2.5-coder:7b",
        roles: ["chat", "autocomplete"],
        systemMessage: "You are ELVIX AI specialized for code completion and generation. Provide concise, accurate code suggestions.",
      }
    ],
    tabAutocompleteModel: {
      title: "ELVIX Autocomplete",
      provider: "elvix-local",
      model: "qwen2.5-coder:1.5b",
    },
    customCommands: [
      {
        name: "test",
        prompt: "Write comprehensive unit tests for the highlighted code using ELVIX AI's advanced reasoning. Include edge cases and error scenarios.",
      },
      {
        name: "check", 
        prompt: "Carefully review this code for bugs, security issues, and performance problems. Provide specific suggestions for improvement.",
      },
      {
        name: "explain",
        prompt: "Explain this code in detail, including its purpose, how it works, and any important patterns or concepts used.",
      },
      {
        name: "optimize",
        prompt: "Analyze this code for performance optimizations and suggest improvements while maintaining readability and correctness.",
      },
      {
        name: "document",
        prompt: "Generate comprehensive documentation for this code including JSDoc comments, parameter descriptions, and usage examples.",
      }
    ],
    slashCommands: [
      {
        name: "edit",
        description: "Edit highlighted code using ELVIX AI",
      },
      {
        name: "comment", 
        description: "Add detailed comments to code",
      },
      {
        name: "share",
        description: "Share code snippet with ELVIX community",
      },
      {
        name: "commit",
        description: "Generate commit message for changes",
      }
    ],
    contextProviders: [
      {
        name: "diff",
        params: {},
      },
      {
        name: "open",
        params: {},
      },
      {
        name: "terminal",
        params: {},
      },
      {
        name: "problems",
        params: {},
      },
      {
        name: "folder",
        params: {},
      },
      {
        name: "codebase",
        params: {},
      }
    ],
    allowAnonymousTelemetry: false,
    embeddingsProvider: {
      provider: "transformers.js",
      model: "Xenova/all-MiniLM-L6-v2",
    },
    experimental: {
      modelRoles: true,
      readRangeSync: true,
    },
    ui: {
      fontSize: 14,
      displayRawMarkdown: false,
    },
    docs: [
      {
        title: "ELVIX AI Documentation",
        startUrl: "https://docs.elvix.ai",
      }
    ]
  };
}
