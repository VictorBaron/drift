import { Injectable } from '@nestjs/common';
import { Client } from '@notionhq/client';
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { NotionToMarkdown } from 'notion-to-md';

import { NotionApiGateway, type NotionPage, type NotionSearchResult } from '../../domain/gateways/notion-api.gateway';

@Injectable()
export class HttpNotionApiGateway extends NotionApiGateway {
  private readonly client: Client;
  private readonly n2m: NotionToMarkdown;

  constructor() {
    super();
    this.client = new Client({ auth: process.env.NOTION_INTEGRATION_TOKEN });
    this.n2m = new NotionToMarkdown({ notionClient: this.client });
  }

  async getPage(pageId: string): Promise<NotionPage> {
    const response = await this.client.pages.retrieve({ page_id: pageId });
    const page = response as PageObjectResponse;
    return {
      title: this.extractTitle(page),
      lastEditedTime: new Date(page.last_edited_time),
      lastEditedBy: page.last_edited_by.id,
    };
  }

  async getPageContent(pageId: string): Promise<string> {
    const mdBlocks = await this.n2m.pageToMarkdown(pageId);
    const { parent } = this.n2m.toMarkdownString(mdBlocks);
    return parent;
  }

  async searchPages(query: string): Promise<NotionSearchResult[]> {
    const response = await this.client.search({
      query,
      filter: { property: 'object', value: 'page' },
    });

    return response.results
      .filter((result): result is PageObjectResponse => result.object === 'page' && 'properties' in result)
      .map((page) => ({
        id: page.id,
        title: this.extractTitle(page),
        url: page.url,
      }));
  }

  private extractTitle(page: PageObjectResponse): string {
    const titleProp = Object.values(page.properties).find((prop) => prop.type === 'title');
    if (!titleProp || titleProp.type !== 'title') return '';
    return titleProp.title.map((t) => t.plain_text).join('');
  }
}
