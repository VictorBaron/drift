import { CommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler } from 'src/common/application/command-handler';
import { Account, AccountRepository } from '@/accounts/domain';
import { SlackChannelsImportService } from '../services/slack-channels-import.service';
import { SlackConversationsImportService } from '../services/slack-conversations-import.service';
import { SlackUsersImportService } from '../services/slack-users-import.service';

export class ProvisionAccountFromSlackCommand {
  constructor(
    readonly props: {
      teamId: string;
      teamName: string;
      botToken: string;
      installerSlackUserId: string;
    },
  ) {}
}

@CommandHandler(ProvisionAccountFromSlackCommand)
export class ProvisionAccountFromSlackHandler extends BaseCommandHandler<ProvisionAccountFromSlackCommand> {
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly slackUsersImport: SlackUsersImportService,
    private readonly slackChannelsImport: SlackChannelsImportService,
    private readonly slackConversationsImport: SlackConversationsImportService,
  ) {
    super();
  }

  async execute(command: ProvisionAccountFromSlackCommand): Promise<void> {
    const { teamId, teamName, botToken, installerSlackUserId } = command.props;

    const account = await this.findOrCreateAccount({ teamId, teamName });

    await this.slackUsersImport.importUsers({
      account,
      botToken,
      installerSlackUserId,
    });

    await this.slackChannelsImport.importChannels({ account, botToken });

    await this.slackConversationsImport.importConversations({
      account,
      botToken,
    });
  }

  private async findOrCreateAccount({
    teamId,
    teamName,
  }: {
    teamId: string;
    teamName: string;
  }): Promise<Account> {
    const existing = await this.accountRepository.findBySlackTeamId(teamId);
    if (existing) return existing;

    const account = Account.create({ name: teamName, slackTeamId: teamId });

    await this.accountRepository.save(account);
    return account;
  }
}
