import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TokenEncryption } from 'auth/token-encryption';

import { OrganizationRepository } from '@/accounts/domain/repositories/organization.repository';
import { LINEAR_API_GATEWAY, LinearApiGateway } from '@/integrations/linear/domain/gateways/linear-api.gateway';

export interface ConnectLinearCommand {
  orgId: string;
  code: string;
  redirectUri: string;
}

@Injectable()
export class ConnectLinearHandler {
  constructor(
    private readonly orgRepo: OrganizationRepository,
    private readonly tokenEncryption: TokenEncryption,
    @Inject(LINEAR_API_GATEWAY) private readonly linearApi: LinearApiGateway,
  ) {}

  async execute(command: ConnectLinearCommand): Promise<void> {
    const token = await this.linearApi.exchangeToken(command.code, command.redirectUri);
    const org = await this.orgRepo.findById(command.orgId);
    if (!org) throw new NotFoundException('Organization not found');

    org.connectLinear(this.tokenEncryption.encrypt(token));
    await this.orgRepo.save(org);
  }
}
