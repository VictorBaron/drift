import Anthropic from '@anthropic-ai/sdk';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { LlmGenerationResult } from '../../domain/gateways/llm.gateway';
import { LlmGateway } from '../../domain/gateways/llm.gateway';

const MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 4096;
const TEMPERATURE = 0.3;
const MAX_ATTEMPTS = 3;
const INITIAL_DELAY_MS = 1000;

@Injectable()
export class AnthropicLlmGateway extends LlmGateway {
  private readonly client: Anthropic;
  private readonly logger = new Logger(AnthropicLlmGateway.name);

  constructor(private readonly config: ConfigService) {
    super();
    this.client = new Anthropic({ apiKey: this.config.getOrThrow('ANTHROPIC_API_KEY') });
  }

  async generate(systemPrompt: string, userPrompt: string): Promise<LlmGenerationResult> {
    return this.attempt(systemPrompt, userPrompt, 0);
  }

  private async attempt(systemPrompt: string, userPrompt: string, attempt: number): Promise<LlmGenerationResult> {
    try {
      const response = await this.client.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        temperature: TEMPERATURE,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      const { input_tokens, output_tokens } = response.usage;
      this.logger.log(`LLM tokens — input: ${input_tokens}, output: ${output_tokens}`);

      const block = response.content[0];
      if (block.type !== 'text') throw new Error('Unexpected non-text LLM response');

      return { content: block.text, promptTokens: input_tokens, completionTokens: output_tokens };
    } catch (error) {
      if (this.isRetryable(error) && attempt < MAX_ATTEMPTS - 1) {
        const delay = INITIAL_DELAY_MS * 2 ** attempt;
        this.logger.warn(`LLM error (attempt ${attempt + 1}), retrying in ${delay}ms: ${error}`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.attempt(systemPrompt, userPrompt, attempt + 1);
      }
      throw error;
    }
  }

  private isRetryable(error: unknown): boolean {
    return error instanceof Anthropic.APIError && (error.status === 429 || error.status === 500);
  }
}
