import { Injectable } from '@nestjs/common';
import { BaseService } from 'common/application/service';
import { UrgencyScoringResult } from '@/scoring/domain/gateways/urgency-scoring.gateway';

@Injectable()
export class ParseJsonOutputService extends BaseService {
  private retries: number;

  parse(rawJson: string, retries = 0) {
    this.retries = retries;
    try {
      const parsed = this.parseJsonOutput(rawJson) as UrgencyScoringResult;
      if (!parsed.score || parsed.score < 1 || parsed.score > 5) {
        this.logger.warn('No score', parsed);
        return {
          score: 5,
          reasoning: 'No reasoning - AI failed to evaluate this message',
          confidenceScore: 0,
        };
      }
      return {
        score: parsed.score,
        reasoning: parsed.reasoning ?? 'No reasoning',
        confidenceScore: parsed.confidenceScore ?? 0,
      };
    } catch (e) {
      this.logger.log(rawJson);
      this.logger.error(e);

      if (this.retries) {
        return this.retryParsing();
      }

      return {
        score: 5,
        reasoning: 'No reasoning - AI failed to evaluate this message',
        confidenceScore: 0,
      };
    }
  }

  private retryParsing() {
    this.retries--;
    // TODO: retry with AI
    return {
      score: 5,
      reasoning: 'No reasoning - AI failed to evaluate this message',
      confidenceScore: 0,
    };
  }

  private parseJsonOutput(raw: string) {
    const cleaned = raw
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    return JSON.parse(cleaned);
  }
}
