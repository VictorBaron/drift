import { Inject, Injectable } from '@nestjs/common';
import { BaseService } from 'common/application/service';
import type { ReportContent } from '@/reports/domain/aggregates/report.aggregate';
import { LLM_GATEWAY, LlmGateway } from '../gateways/llm.gateway';

@Injectable()
export class ReportParserService extends BaseService {
  constructor(@Inject(LLM_GATEWAY) private readonly llmGateway: LlmGateway) {
    super();
  }

  async parseReport(llmOutput: string): Promise<ReportContent> {
    const parsed = this.tryParseJson(llmOutput);
    if (parsed) return parsed;

    this.logger.warn('Initial JSON parse failed, retrying with correction prompt');
    const corrected = await this.retryWithCorrection(llmOutput);
    const reparsed = this.tryParseJson(corrected);
    if (reparsed) return reparsed;

    throw new Error('Failed to parse LLM output as valid ReportContent after retry');
  }

  private tryParseJson(raw: string): ReportContent | null {
    try {
      const cleaned = raw
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();
      const parsed = JSON.parse(cleaned) as ReportContent;
      this.validateReportContent(parsed);
      return parsed;
    } catch {
      return null;
    }
  }

  private validateReportContent(content: ReportContent): void {
    if (!content.health) throw new Error('Missing health');
    if (typeof content.progress !== 'number') throw new Error('Missing progress');
    if (!content.narrative) throw new Error('Missing narrative');
    if (!content.drift) throw new Error('Missing drift');
    if (!content.delivery) throw new Error('Missing delivery');
    if (!Array.isArray(content.decisions)) throw new Error('Missing decisions array');
    if (!Array.isArray(content.blockers)) throw new Error('Missing blockers array');
  }

  private async retryWithCorrection(originalOutput: string): Promise<string> {
    const systemPrompt =
      'You are a JSON repair assistant. Fix the provided output to be valid JSON matching the required ReportContent schema.';
    const userPrompt = `The following LLM output could not be parsed as valid JSON. Please extract and return ONLY the valid JSON:\n\n${originalOutput}`;
    const result = await this.llmGateway.generate(systemPrompt, userPrompt);
    return result.content;
  }
}
