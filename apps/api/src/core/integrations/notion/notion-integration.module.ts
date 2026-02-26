import { Module } from '@nestjs/common';

import { HasNotionPageChangedQuery } from './application/queries/has-notion-page-changed/has-notion-page-changed.query';
import { ReadNotionPageQuery } from './application/queries/read-notion-page/read-notion-page.query';
import { NOTION_API_GATEWAY } from './domain/gateways/notion-api.gateway';
import { HttpNotionApiGateway } from './infrastructure/gateways/http-notion-api.gateway';

@Module({
  providers: [
    ReadNotionPageQuery,
    HasNotionPageChangedQuery,
    { provide: NOTION_API_GATEWAY, useClass: HttpNotionApiGateway },
  ],
  exports: [ReadNotionPageQuery, HasNotionPageChangedQuery],
})
export class NotionIntegrationModule {}
