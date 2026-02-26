import { Injectable } from '@nestjs/common';

import { NotionApiGateway, type NotionPage, type NotionSearchResult } from '../../domain/gateways/notion-api.gateway';

@Injectable()
export class FakeNotionApiGateway extends NotionApiGateway {
  private pages: Map<string, NotionPage> = new Map();
  private pageContents: Map<string, string> = new Map();
  private searchResults: NotionSearchResult[] = [];

  seedPage(pageId: string, page: NotionPage): void {
    this.pages.set(pageId, page);
  }

  seedPageContent(pageId: string, content: string): void {
    this.pageContents.set(pageId, content);
  }

  seedSearchResults(results: NotionSearchResult[]): void {
    this.searchResults = results;
  }

  clear(): void {
    this.pages.clear();
    this.pageContents.clear();
    this.searchResults = [];
  }

  async getPage(pageId: string): Promise<NotionPage> {
    const page = this.pages.get(pageId);
    if (!page) throw new Error(`Notion page not found in fake gateway: ${pageId}`);
    return page;
  }

  async getPageContent(pageId: string): Promise<string> {
    const content = this.pageContents.get(pageId);
    if (content === undefined) throw new Error(`Notion page content not found in fake gateway: ${pageId}`);
    return content;
  }

  async searchPages(_query: string): Promise<NotionSearchResult[]> {
    return this.searchResults;
  }
}
