import Anthropic from '@anthropic-ai/sdk';
import { Injectable, Logger } from '@nestjs/common';
import { ParseJsonOutputService } from '@/ai/parse-json-output.service';
import type { UrgencyScoringGateway, UrgencyScoringInput, UrgencyScoringResult } from '@/scoring/domain/gateways';

const enum AnthropicModel {
  HAIKU = 'claude-haiku-4-5',
  SONNET = 'claude-sonnet-4-6',
  OPUS = 'claude-opus-4-6',
}

@Injectable()
export class AnthropicUrgencyScoringGateway implements UrgencyScoringGateway {
  private client: Anthropic;
  protected readonly logger = new Logger(this.constructor.name);

  constructor(private readonly parseJsonOutputService: ParseJsonOutputService) {
    this.client = new Anthropic();
  }

  setScore(): void {
    throw new Error('Cannot set score on Anthropic Urgency Scoring');
  }

  async scoreMessage(input: UrgencyScoringInput): Promise<UrgencyScoringResult> {
    const response = await this.client.messages.create({
      model: AnthropicModel.HAIKU,
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: `${this.promptLogic()}\n\n${this.promptReturnFormat()}\n\nMessage: ${input.text}`,
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock) {
      throw new Error('No text response from Anthropic');
    }

    const messageAnalysis = this.parseJsonOutputService.parse(textBlock.text) as UrgencyScoringResult;
    this.logger.log(messageAnalysis);

    return messageAnalysis;
  }

  private promptLogic() {
    return 'Score the urgency of this Slack message on a scale of 1-5 (1=Noise, 2=FYI, 3=important but it can wait a few hours, 4=important and have to be dealt within an hour, 5=critical and have to be dealt now).';
  }
  private promptReturnFormat() {
    return 'Respond with JSON only: {"score": <number>, "reasoning": "<brief reason>", "confidenceScore": <Score from 0 to 1 the confidence in this score>}';
  }
}
