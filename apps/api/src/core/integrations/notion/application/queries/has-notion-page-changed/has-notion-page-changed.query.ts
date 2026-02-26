import { Inject, Injectable } from '@nestjs/common';

import { NOTION_API_GATEWAY, NotionApiGateway } from '../../../domain/gateways/notion-api.gateway';

export interface HasNotionPageChangedInput {
  pageId: string;
  since: Date;
}

@Injectable()
export class HasNotionPageChangedQuery {
  constructor(
    @Inject(NOTION_API_GATEWAY)
    private readonly notionGateway: NotionApiGateway,
  ) {}

  async execute({ pageId, since }: HasNotionPageChangedInput): Promise<boolean> {
    const page = await this.notionGateway.getPage(pageId);
    return page.lastEditedTime > since;
  }
}
