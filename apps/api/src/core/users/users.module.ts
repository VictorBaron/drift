import { forwardRef, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthModule } from 'auth/auth.module';

// Application layer - Commands
import { CreateOAuthUser, CreateUser, LinkGoogleAccount } from './application/commands';
// Application layer - Queries
import { GetAllUsers, GetUserByEmail, GetUserByGoogleId, GetUserById } from './application/queries';
import { UserPersistenceModule } from './infrastructure/persistence/user-persistence.module';
import { UsersController } from './users.controller';

@Module({
  imports: [CqrsModule, forwardRef(() => AuthModule), UserPersistenceModule.use('orm')],
  controllers: [UsersController],
  providers: [
    // Commands
    CreateUser,
    CreateOAuthUser,
    LinkGoogleAccount,
    // Queries
    GetUserById,
    GetUserByEmail,
    GetUserByGoogleId,
    GetAllUsers,
  ],
  exports: [
    // Queries
    GetUserById,
    GetUserByEmail,
    GetUserByGoogleId,
    GetAllUsers,
  ],
})
export class UsersModule {}
