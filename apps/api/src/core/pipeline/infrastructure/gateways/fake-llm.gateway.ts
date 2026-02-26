import { Injectable } from '@nestjs/common';
import type { LlmGenerationResult } from '../../domain/gateways/llm.gateway';
import { LlmGateway } from '../../domain/gateways/llm.gateway';

const DEFAULT_RESPONSE = JSON.stringify({
  health: 'on-track',
  healthLabel: 'On Track',
  progress: 60,
  narrative: 'The project is progressing well this week. Key features are being delivered on schedule.',
  decisions: [],
  drift: { level: 'none', label: 'Aligned', details: 'Implementation matches original spec.' },
  blockers: [],
  keyResults: [],
  threads: [],
  delivery: { merged: 3, inReview: 2, blocked: 0, created: 5, velocity: '+20%', velocityLabel: 'vs last week' },
  sourceCounts: { slack: 10, linear: 5, notion: 0 },
});

@Injectable()
export class FakeLlmGateway extends LlmGateway {
  private response = DEFAULT_RESPONSE;
  readonly calls: Array<{ systemPrompt: string; userPrompt: string }> = [];

  setResponse(response: string): void {
    this.response = response;
  }

  async generate(systemPrompt: string, userPrompt: string): Promise<LlmGenerationResult> {
    this.calls.push({ systemPrompt, userPrompt });
    return { content: this.response, promptTokens: 100, completionTokens: 200 };
  }
}
