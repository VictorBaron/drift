import type { SlackUserInfo, SlackUsersGateway } from '@/accounts/domain/gateways/slack-users.gateway';

export class FakeSlackUsersGateway implements SlackUsersGateway {
  private users: SlackUserInfo[];

  async listTeamMembers(_botToken: string): Promise<SlackUserInfo[]> {
    return Promise.resolve(this.users ?? []);
  }

  setUsers(users: SlackUserInfo[]) {
    this.users = users;
  }
}
