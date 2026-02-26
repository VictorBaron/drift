import { Test } from '@nestjs/testing';

import { NOTION_API_GATEWAY } from '../../../domain/gateways/notion-api.gateway';
import { FakeNotionApiGateway } from '../../../infrastructure/gateways/fake-notion-api.gateway';
import { HasNotionPageChangedQuery } from './has-notion-page-changed.query';

describe('HasNotionPageChangedQuery', () => {
  let query: HasNotionPageChangedQuery;
  let gateway: FakeNotionApiGateway;

  const PAGE_ID = 'page-1';
  const LAST_EDITED_TIME = new Date('2026-02-20T10:00:00Z');

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [HasNotionPageChangedQuery, { provide: NOTION_API_GATEWAY, useClass: FakeNotionApiGateway }],
    }).compile();

    query = module.get(HasNotionPageChangedQuery);
    gateway = module.get(NOTION_API_GATEWAY);
    gateway.clear();
    gateway.seedPage(PAGE_ID, { title: 'Test Page', lastEditedTime: LAST_EDITED_TIME, lastEditedBy: 'user-1' });
  });

  it('should return true when the page was edited after the given date', async () => {
    const result = await query.execute({ pageId: PAGE_ID, since: new Date('2026-02-19T10:00:00Z') });
    expect(result).toBe(true);
  });

  it('should return false when the page was not edited after the given date', async () => {
    const result = await query.execute({ pageId: PAGE_ID, since: new Date('2026-02-21T10:00:00Z') });
    expect(result).toBe(false);
  });

  it('should return false when the page was edited at exactly the given date', async () => {
    const result = await query.execute({ pageId: PAGE_ID, since: LAST_EDITED_TIME });
    expect(result).toBe(false);
  });

  it('should throw when the page is not found', async () => {
    await expect(query.execute({ pageId: 'unknown-page', since: new Date() })).rejects.toThrow('unknown-page');
  });
});
