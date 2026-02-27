import { IngestOrganizationSlackService } from './ingest-organization-slack/ingest-organization-slack.service';
import { IngestSlackMessagesService } from './ingest-slack-messages/ingest-slack-messages.service';
import { SlackFilterService } from './slack-filter.service';
import { SlackReportFormatterService } from './slack-report-formatter.service';

export const slackIntegrationServices = [
  IngestOrganizationSlackService,
  IngestSlackMessagesService,
  SlackFilterService,
  SlackReportFormatterService,
];
