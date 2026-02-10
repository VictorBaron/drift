import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import {
  CreateOAuthUserCommand,
  CreateOAuthUserHandler,
  LinkGoogleAccountCommand,
  LinkGoogleAccountHandler,
} from 'src/core/users/application/commands';
import {
  GetUserByEmailHandler,
  GetUserByEmailQuery,
  GetUserByGoogleIdHandler,
  GetUserByGoogleIdQuery,
} from 'src/core/users/application/queries';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly config: ConfigService,
    private readonly getUserByGoogleIdHandler: GetUserByGoogleIdHandler,
    private readonly getUserByEmailHandler: GetUserByEmailHandler,
    private readonly createOAuthUserHandler: CreateOAuthUserHandler,
    private readonly linkGoogleAccountHandler: LinkGoogleAccountHandler,
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
    const userByGoogleId = await this.getUserByGoogleIdHandler.execute(
      new GetUserByGoogleIdQuery(googleId),
    );
    if (userByGoogleId) return userByGoogleId;

    const userByEmail = await this.getUserByEmailHandler.execute(
      new GetUserByEmailQuery(email),
    );

    if (userByEmail) {
      return this.linkGoogleAccountHandler.execute(
        new LinkGoogleAccountCommand({
          userId: userByEmail.getId(),
          googleId,
          name: displayName,
        }),
      );
    }

    return this.createOAuthUserHandler.execute(
      new CreateOAuthUserCommand({
        email,
        googleId,
        name: displayName,
      }),
    );
  }
}
