import { Test } from '@nestjs/testing';

import { NOTION_API_GATEWAY } from '../../../domain/gateways/notion-api.gateway';
import { FakeNotionApiGateway } from '../../../infrastructure/gateways/fake-notion-api.gateway';
import { ReadNotionPageQuery } from './read-notion-page.query';

describe('ReadNotionPageQuery', () => {
  let query: ReadNotionPageQuery;
  let gateway: FakeNotionApiGateway;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [ReadNotionPageQuery, { provide: NOTION_API_GATEWAY, useClass: FakeNotionApiGateway }],
    }).compile();

    query = module.get(ReadNotionPageQuery);
    gateway = module.get(NOTION_API_GATEWAY);
    gateway.clear();
  });

  it('should return the page content as markdown', async () => {
    gateway.seedPageContent('page-1', '# My Spec\n\n- Goal: ship fast\n- Constraint: no auth');

    const result = await query.execute({ pageId: 'page-1' });

    expect(result).toBe('# My Spec\n\n- Goal: ship fast\n- Constraint: no auth');
  });

  it('should throw when page content is not found', async () => {
    await expect(query.execute({ pageId: 'unknown-page' })).rejects.toThrow('unknown-page');
  });
});
