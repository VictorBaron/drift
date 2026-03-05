import { Module } from '@nestjs/common';
import { LLM_GATEWAY } from '@/pipeline/domain/gateways/llm.gateway';
import { AnthropicLlmGateway } from '@/pipeline/infrastructure/gateways/anthropic-llm.gateway';
import { ExtractObjectiveHandler } from './application/commands/extract-objective/extract-objective.handler';
import { HasNotionPageChangedQuery } from './application/queries/has-notion-page-changed/has-notion-page-changed.query';
import { ReadNotionPageQuery } from './application/queries/read-notion-page/read-notion-page.query';
import { NOTION_API_GATEWAY } from './domain/gateways/notion-api.gateway';
import { NotionController } from './infrastructure/controllers/notion.controller';
import { HttpNotionApiGateway } from './infrastructure/gateways/http-notion-api.gateway';

@Module({
  controllers: [NotionController],
  providers: [
    ReadNotionPageQuery,
    HasNotionPageChangedQuery,
    ExtractObjectiveHandler,
    { provide: NOTION_API_GATEWAY, useClass: HttpNotionApiGateway },
    { provide: LLM_GATEWAY, useClass: AnthropicLlmGateway },
  ],
  exports: [ReadNotionPageQuery, HasNotionPageChangedQuery],
})
export class NotionIntegrationModule {}
