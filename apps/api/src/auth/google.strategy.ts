import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CommandBus } from '@nestjs/cqrs';
import { PassportStrategy } from '@nestjs/passport';
import { type Profile, Strategy, type VerifyCallback } from 'passport-google-oauth20';
import { CreateOAuthUserCommand, LinkGoogleAccountCommand } from '@/users/application/commands';
import {
  GetUserByEmail,
  GetUserByEmailQuery,
  GetUserByGoogleId,
  GetUserByGoogleIdQuery,
} from '@/users/application/queries';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    readonly config: ConfigService,
    private readonly commandBus: CommandBus,
    private readonly getUserByGoogleId: GetUserByGoogleId,
    private readonly getUserByEmail: GetUserByEmail,
  ) {
    super({
      clientID: config.get<string>('GOOGLE_CLIENT_ID')!,
      clientSecret: config.get<string>('GOOGLE_CLIENT_SECRET')!,
      callbackURL: config.get<string>('GOOGLE_CALLBACK_URL')!,
      scope: ['email', 'profile'],
    });
  }

  async validate({
    _accessToken,
    _refreshToken,
    profile,
    done,
  }: {
    _accessToken: string;
    _refreshToken: string;
    profile: Profile;
    done: VerifyCallback;
  }): Promise<void> {
    const { id: googleId, emails, displayName } = profile;
    const email = emails?.[0]?.value;

    if (!email) {
      return done(new Error('No email from Google'), undefined);
    }

    const user = await this.fetchOrCreateUser({ googleId, displayName, email });

    const userJson = user.toJSON();
    done(null, userJson);
  }

  private async fetchOrCreateUser({
    googleId,
    displayName,
    email,
  }: {
    googleId: string;
    displayName: string;
    email: string;
  }) {
    const userByGoogleId = await this.getUserByGoogleId.execute(new GetUserByGoogleIdQuery(googleId));
    if (userByGoogleId) return userByGoogleId;

    const userByEmail = await this.getUserByEmail.execute(new GetUserByEmailQuery(email));

    if (userByEmail) {
      return this.commandBus.execute(
        new LinkGoogleAccountCommand({
          userId: userByEmail.getId(),
          googleId,
          name: displayName,
        }),
      );
    }

    return this.commandBus.execute(
      new CreateOAuthUserCommand({
        email,
        googleId,
        name: displayName,
      }),
    );
  }
}
