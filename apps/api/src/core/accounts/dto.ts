import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';

import { MemberRoleLevel } from './domain';

export class CreateAccountDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  slackTeamId!: string;
}

export class UpdateAccountDto {
  @IsString()
  @IsNotEmpty()
  name!: string;
}

export class InviteMemberDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}

export class ChangeMemberRoleDto {
  @IsEnum(MemberRoleLevel)
  role!: MemberRoleLevel;
}

export interface AccountResponseDTO {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemberResponseDTO {
  id: string;
  accountId: string;
  userId: string;
  role: MemberRoleLevel;
  invitedAt: Date | null;
  activatedAt: Date | null;
  disabledAt: Date | null;
  invitedById: string | null;
  lastActiveAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvitationResponseDTO {
  id: string;
  accountId: string;
  accountName: string;
  invitedAt: Date;
  invitedById: string | null;
}
