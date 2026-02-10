import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';

// Application layer - Commands
import {
  CreateOAuthUserHandler,
  CreateUserHandler,
  LinkGoogleAccountHandler,
} from './application/commands';
// Application layer - Queries
import {
  GetAllUsersHandler,
  GetUserByEmailHandler,
  GetUserByGoogleIdHandler,
  GetUserByIdHandler,
} from './application/queries';
import { UserPersistenceModule } from './infrastructure/persistence/user-persistence.module';
import { UsersController } from './users.controller';

@Module({
  imports: [forwardRef(() => AuthModule), UserPersistenceModule.use('orm')],
  controllers: [UsersController],
  providers: [
    // Commands
    CreateUserHandler,
    CreateOAuthUserHandler,
    LinkGoogleAccountHandler,
    // Queries
    GetUserByIdHandler,
    GetUserByEmailHandler,
    GetUserByGoogleIdHandler,
    GetAllUsersHandler,
  ],
  exports: [
    // Commands
    CreateUserHandler,
    CreateOAuthUserHandler,
    LinkGoogleAccountHandler,
    // Queries
    GetUserByIdHandler,
    GetUserByEmailHandler,
    GetUserByGoogleIdHandler,
    GetAllUsersHandler,
  ],
})
export class UsersModule {}
