export const LLM_GATEWAY = 'LLM_GATEWAY';

export interface LlmGenerationResult {
  content: string;
  promptTokens: number;
  completionTokens: number;
}

export abstract class LlmGateway {
  abstract generate(systemPrompt: string, userPrompt: string): Promise<LlmGenerationResult>;
}
