import { AggregateRoot, type AggregateRootProps } from 'common/domain';

interface SlackInstallationProps extends AggregateRootProps {
  teamId: string | null;
  teamName: string | null;
  enterpriseId: string | null;
  enterpriseName: string | null;
  userId: string;
  botToken: string | null;
  userToken: string | null;
  botId: string | null;
  botUserId: string | null;
  tokenType: string | null;
  isEnterpriseInstall: boolean;
  rawInstallation: Record<string, unknown>;
  installedAt: Date;
}

export interface SlackInstallationJSON {
  id: string;
  teamId: string | null;
  teamName: string | null;
  enterpriseId: string | null;
  enterpriseName: string | null;
  userId: string;
  botToken: string | null;
  userToken: string | null;
  botId: string | null;
  botUserId: string | null;
  tokenType: string | null;
  isEnterpriseInstall: boolean;
  rawInstallation: Record<string, unknown>;
  installedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface CreateSlackInstallationProps {
  teamId: string | null;
  teamName: string | null;
  enterpriseId: string | null;
  enterpriseName: string | null;
  userId: string;
  botToken: string | null;
  userToken: string | null;
  botId: string | null;
  botUserId: string | null;
  tokenType: string | null;
  isEnterpriseInstall: boolean;
  rawInstallation: Record<string, unknown>;
}
export class SlackInstallation extends AggregateRoot {
  private teamId: string | null;
  private teamName: string | null;
  private enterpriseId: string | null;
  private enterpriseName: string | null;
  private userId: string;
  private botToken: string | null;
  private userToken: string | null;
  private botId: string | null;
  private botUserId: string | null;
  private tokenType: string | null;
  private isEnterpriseInstall: boolean;
  private rawInstallation: Record<string, unknown>;
  private installedAt: Date;

  private constructor(props: SlackInstallationProps) {
    super(props);
    this.teamId = props.teamId;
    this.enterpriseId = props.enterpriseId;
    this.userId = props.userId;
    this.botToken = props.botToken;
    this.userToken = props.userToken;
    this.botId = props.botId;
    this.botUserId = props.botUserId;
    this.tokenType = props.tokenType;
    this.isEnterpriseInstall = props.isEnterpriseInstall;
    this.rawInstallation = props.rawInstallation;
    this.installedAt = props.installedAt;
    this.teamName = props.teamName;
    this.enterpriseName = props.enterpriseName;
  }
  getTeamId(): string | null {
    return this.teamId;
  }
  getEnterpriseId(): string | null {
    return this.enterpriseId;
  }
  getUserId(): string {
    return this.userId;
  }
  getBotToken(): string | null {
    return this.botToken;
  }
  getUserToken(): string | null {
    return this.userToken;
  }
  getBotId(): string | null {
    return this.botId;
  }

  static reconstitute(props: SlackInstallationProps): SlackInstallation {
    return new SlackInstallation(props);
  }

  static create(props: CreateSlackInstallationProps): SlackInstallation {
    const now = new Date();
    return new SlackInstallation({
      id: crypto.randomUUID(),
      teamId: props.teamId,
      teamName: props.teamName,
      enterpriseId: props.enterpriseId,
      enterpriseName: props.enterpriseName,
      userId: props.userId,
      botToken: props.botToken,
      userToken: props.userToken,
      botId: props.botId,
      botUserId: props.botUserId,
      tokenType: props.tokenType,
      isEnterpriseInstall: props.isEnterpriseInstall,
      rawInstallation: props.rawInstallation,
      installedAt: now,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
  }

  update(props: Omit<SlackInstallationProps, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'installedAt'>): void {
    this.teamId = props.teamId;
    this.enterpriseId = props.enterpriseId;
    this.userId = props.userId;
    this.botToken = props.botToken;
    this.userToken = props.userToken;
    this.botId = props.botId;
    this.botUserId = props.botUserId;
    this.tokenType = props.tokenType;
    this.isEnterpriseInstall = props.isEnterpriseInstall;
    this.rawInstallation = props.rawInstallation;
    this.updatedAt = new Date();
  }

  toJSON(): SlackInstallationJSON {
    return {
      id: this.id,
      teamId: this.teamId,
      teamName: this.teamName,
      enterpriseId: this.enterpriseId,
      enterpriseName: this.enterpriseName,
      userId: this.userId,
      botToken: this.botToken,
      userToken: this.userToken,
      botId: this.botId,
      botUserId: this.botUserId,
      tokenType: this.tokenType,
      isEnterpriseInstall: this.isEnterpriseInstall,
      rawInstallation: this.rawInstallation,
      installedAt: this.installedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
    };
  }
}
