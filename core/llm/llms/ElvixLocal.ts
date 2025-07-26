import { Mutex } from "async-mutex";
import { JSONSchema7, JSONSchema7Object } from "json-schema";
import { v4 as uuidv4 } from "uuid";

import { streamResponse } from "@continuedev/fetch";
import {
  ChatMessage,
  ChatMessageRole,
  CompletionOptions,
  LLMOptions,
  ModelInstaller,
} from "../../index.js";
import { renderChatMessage } from "../../util/messageContent.js";
import { getRemoteModelInfo } from "../../util/ollamaHelper.js";
import { BaseLLM } from "../index.js";

interface ElvixLocalModelConfig {
  modelPath?: string;
  contextSize?: number;
  gpuLayers?: number;
  threads?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
  repeatPenalty?: number;
  systemPrompt?: string;
  enableMmap?: boolean;
  enableMlock?: boolean;
  quantization?: "q4_0" | "q4_1" | "q5_0" | "q5_1" | "q8_0" | "f16" | "f32";
}

type ElvixLocalChatMessage = {
  role: ChatMessageRole;
  content: string;
  images?: string[] | null;
  tool_calls?: {
    function: {
      name: string;
      arguments: JSONSchema7Object;
    };
  }[];
};

interface ElvixLocalOptions {
  model: string;
  stream?: boolean;
  keep_alive?: number;
  messages?: ElvixLocalChatMessage[];
  prompt?: string;
  system?: string;
  template?: string;
  context?: string;
  raw?: boolean;
  format?: "json";
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    repeat_penalty?: number;
    seed?: number;
    num_predict?: number;
    stop?: string | string[];
  };
}

interface ElvixLocalResponse {
  model: string;
  created_at: string;
  response?: string;
  message?: ElvixLocalChatMessage;
  done: boolean;
  done_reason?: string;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

class ElvixLocal extends BaseLLM implements ModelInstaller {
  static providerName = "elvix-local";
  static defaultOptions: Partial<LLMOptions> = {
    apiBase: "http://127.0.0.1:11434/",
    model: "llama3.1:8b",
  };

  private _getModelInfo(model: string) {
    return getRemoteModelInfo(this.apiBase!, model);
  }

  private static modelMutex = new Mutex();

  static pullModelRequestId: string | undefined = undefined;

  private _convertArgs(options: CompletionOptions) {
    const elvixOptions: ElvixLocalOptions["options"] = {
      temperature: options.temperature,
      top_p: options.topP,
      top_k: options.topK,
      repeat_penalty: options.frequencyPenalty,
      seed: options.seed,
      num_predict: options.maxTokens,
      stop: options.stop,
    };

    return elvixOptions;
  }

  private _convertMessage(message: ChatMessage): ElvixLocalChatMessage {
    const content = renderChatMessage(message);
    return {
      role: message.role,
      content,
      images: message.role === "user" ? message.images : undefined,
    };
  }

  protected async *_streamComplete(
    prompt: string,
    signal: AbortSignal,
    options: CompletionOptions,
  ): AsyncGenerator<string> {
    const response = await this.fetch(new URL("api/generate", this.apiBase), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        ...this.requestOptions?.headers,
      },
      body: JSON.stringify({
        model: this.model,
        prompt,
        stream: true,
        options: this._convertArgs(options),
        keep_alive: this.requestOptions?.keepAlive || "5m",
      }),
      signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    for await (const value of streamResponse(response)) {
      try {
        const data = JSON.parse(value) as ElvixLocalResponse;
        if (data.response) {
          yield data.response;
        }
      } catch (e) {
        console.warn("Failed to parse ElvixLocal response:", value);
      }
    }
  }

  protected async *_streamChat(
    messages: ChatMessage[],
    signal: AbortSignal,
    options: CompletionOptions,
  ): AsyncGenerator<ChatMessage> {
    const response = await this.fetch(new URL("api/chat", this.apiBase), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        ...this.requestOptions?.headers,
      },
      body: JSON.stringify({
        model: this.model,
        messages: messages.map(this._convertMessage),
        stream: true,
        options: this._convertArgs(options),
        keep_alive: this.requestOptions?.keepAlive || "5m",
      }),
      signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    for await (const value of streamResponse(response)) {
      try {
        const data = JSON.parse(value) as ElvixLocalResponse;
        if (data.message) {
          yield {
            role: data.message.role,
            content: data.message.content,
          };
        }
      } catch (e) {
        console.warn("Failed to parse ElvixLocal chat response:", value);
      }
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await this.fetch(new URL("api/tags", this.apiBase), {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          ...this.requestOptions?.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.models?.map((model: any) => model.name) || [];
    } catch (error) {
      console.warn("Failed to list models:", error);
      return [];
    }
  }

  async pullModel(model: string): Promise<void> {
    const requestId = uuidv4();
    ElvixLocal.pullModelRequestId = requestId;

    try {
      const response = await this.fetch(new URL("api/pull", this.apiBase), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          ...this.requestOptions?.headers,
        },
        body: JSON.stringify({
          name: model,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }

      // Process streaming pull response
      for await (const value of streamResponse(response)) {
        if (ElvixLocal.pullModelRequestId !== requestId) {
          // Request was cancelled
          break;
        }
        
        try {
          const data = JSON.parse(value);
          if (data.status) {
            console.log(`Pull progress: ${data.status}`);
          }
        } catch (e) {
          // Ignore parse errors for progress updates
        }
      }
    } finally {
      if (ElvixLocal.pullModelRequestId === requestId) {
        ElvixLocal.pullModelRequestId = undefined;
      }
    }
  }

  // ModelInstaller interface implementation
  async installModel(model: string): Promise<void> {
    return ElvixLocal.modelMutex.runExclusive(() => this.pullModel(model));
  }

  async isInstallingModel(): Promise<boolean> {
    return ElvixLocal.pullModelRequestId !== undefined;
  }

  async deleteModel(model: string): Promise<void> {
    try {
      const response = await this.fetch(new URL("api/delete", this.apiBase), {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          ...this.requestOptions?.headers,
        },
        body: JSON.stringify({ name: model }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.warn("Failed to delete model:", error);
      throw error;
    }
  }

  async checkModelExists(model: string): Promise<boolean> {
    const models = await this.listModels();
    return models.includes(model);
  }

  async getModelInfo(model: string): Promise<any> {
    try {
      const response = await this.fetch(new URL("api/show", this.apiBase), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          ...this.requestOptions?.headers,
        },
        body: JSON.stringify({ name: model }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.warn("Failed to get model info:", error);
      return null;
    }
  }

  // Enhanced model management methods
  async optimizeModel(model: string, config: ElvixLocalModelConfig): Promise<void> {
    // This would implement model optimization based on hardware capabilities
    console.log(`Optimizing model ${model} with config:`, config);
  }

  async getSystemResources(): Promise<{
    memoryTotal: number;
    memoryAvailable: number;
    gpuAvailable: boolean;
    gpuMemory?: number;
  }> {
    // Mock implementation - in real usage this would check system resources
    return {
      memoryTotal: 16 * 1024 * 1024 * 1024, // 16GB
      memoryAvailable: 8 * 1024 * 1024 * 1024, // 8GB
      gpuAvailable: true,
      gpuMemory: 8 * 1024 * 1024 * 1024, // 8GB
    };
  }

  async getRecommendedModels(): Promise<Array<{
    name: string;
    size: string;
    description: string;
    recommended: boolean;
    capabilities: string[];
  }>> {
    return [
      {
        name: "llama3.1:8b",
        size: "4.7GB",
        description: "Latest Llama model optimized for code generation",
        recommended: true,
        capabilities: ["chat", "code", "reasoning"]
      },
      {
        name: "codellama:7b",
        size: "3.8GB", 
        description: "Specialized for programming tasks",
        recommended: true,
        capabilities: ["code", "completion", "debugging"]
      },
      {
        name: "qwen2.5-coder:7b",
        size: "4.2GB",
        description: "High-performance coding model",
        recommended: true,
        capabilities: ["code", "completion", "refactoring"]
      },
      {
        name: "deepseek-coder:6.7b",
        size: "3.6GB",
        description: "Advanced code understanding",
        recommended: false,
        capabilities: ["code", "analysis", "documentation"]
      },
      {
        name: "starcoder2:7b",
        size: "4.0GB",
        description: "Multi-language code completion",
        recommended: false,
        capabilities: ["code", "completion", "multilang"]
      },
      {
        name: "mistral:7b",
        size: "4.1GB",
        description: "Fast and efficient reasoning",
        recommended: false,
        capabilities: ["chat", "reasoning", "general"]
      }
    ];
  }
}

export default ElvixLocal;