export const NOTION_API_GATEWAY = 'NOTION_API_GATEWAY';

export interface NotionPage {
  title: string;
  lastEditedTime: Date;
  lastEditedBy: string;
}

export interface NotionSearchResult {
  id: string;
  title: string;
  url: string;
}

export abstract class NotionApiGateway {
  abstract getPage(pageId: string): Promise<NotionPage>;
  abstract getPageContent(pageId: string): Promise<string>;
  abstract searchPages(query: string): Promise<NotionSearchResult[]>;
}
