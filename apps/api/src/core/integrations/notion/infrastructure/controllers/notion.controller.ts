import { Body, Controller, Get, Inject, Post, Query } from '@nestjs/common';
import {
  ExtractObjectiveCommand,
  ExtractObjectiveHandler,
} from '@/integrations/notion/application/commands/extract-objective/extract-objective.handler';
import { NOTION_API_GATEWAY, NotionApiGateway } from '@/integrations/notion/domain/gateways/notion-api.gateway';

@Controller('integrations/notion')
export class NotionController {
  constructor(
    @Inject(NOTION_API_GATEWAY) private readonly notionApi: NotionApiGateway,
    private readonly extractObjective: ExtractObjectiveHandler,
  ) {}

  @Get('page-preview')
  async getPagePreview(@Query('pageId') pageId: string) {
    if (!pageId) return { title: null };
    try {
      const page = await this.notionApi.getPage(pageId);
      return { title: page.title, pageId };
    } catch {
      return { title: null };
    }
  }

  @Post('extract-objective')
  async extractObjectiveFromPage(@Body() body: { pageId: string }) {
    const result = await this.extractObjective.execute(new ExtractObjectiveCommand(body.pageId));
    return result ?? { productObjective: null, keyResults: [] };
  }
}
