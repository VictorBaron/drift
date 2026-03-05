import { Inject, Injectable, Logger } from '@nestjs/common';
import { LLM_GATEWAY, LlmGateway } from '@/pipeline/domain/gateways/llm.gateway';
import { ReadNotionPageQuery } from '../../queries/read-notion-page/read-notion-page.query';

export class ExtractObjectiveCommand {
  constructor(public readonly pageId: string) {}
}

export interface ExtractObjectiveResult {
  productObjective: string;
  keyResults: { text: string; done: boolean }[];
}

const SYSTEM_PROMPT = `You are a product strategy analyst. Given a product specification or brief, extract the core product objective and any key results (OKRs or measurable goals).

Return a JSON object with this exact shape:
{
  "productObjective": "One concise sentence describing what the product is trying to achieve",
  "keyResults": [
    { "text": "Measurable goal or key result", "done": false }
  ]
}

If no explicit key results are mentioned, infer 2-3 from the document context.`;

@Injectable()
export class ExtractObjectiveHandler {
  private readonly logger = new Logger(ExtractObjectiveHandler.name);

  constructor(
    private readonly readNotionPage: ReadNotionPageQuery,
    @Inject(LLM_GATEWAY) private readonly llm: LlmGateway,
  ) {}

  async execute(command: ExtractObjectiveCommand): Promise<ExtractObjectiveResult | null> {
    const content = await this.readNotionPage.execute({ pageId: command.pageId });
    if (!content) return null;

    const userPrompt = `Extract the product objective and key results from this document:\n\n${content.slice(0, 8000)}`;

    const result = await this.llm.generate(SYSTEM_PROMPT, userPrompt);

    return this.parseResult(result.content);
  }

  private parseResult(raw: string): ExtractObjectiveResult | null {
    try {
      const cleaned = raw
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      return JSON.parse(cleaned) as ExtractObjectiveResult;
    } catch (err) {
      this.logger.error(`Failed to parse extracted objective: ${err}`);
      return null;
    }
  }
}
