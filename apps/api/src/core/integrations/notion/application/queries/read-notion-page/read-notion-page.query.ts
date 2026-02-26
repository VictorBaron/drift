import { Inject, Injectable } from '@nestjs/common';

import { NOTION_API_GATEWAY, NotionApiGateway } from '../../../domain/gateways/notion-api.gateway';

export interface ReadNotionPageInput {
  pageId: string;
}

@Injectable()
export class ReadNotionPageQuery {
  constructor(
    @Inject(NOTION_API_GATEWAY)
    private readonly notionGateway: NotionApiGateway,
  ) {}

  async execute({ pageId }: ReadNotionPageInput): Promise<string> {
    return this.notionGateway.getPageContent(pageId);
  }
}
