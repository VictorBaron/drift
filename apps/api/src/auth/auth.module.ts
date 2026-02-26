import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AccountsPersistenceModule } from '@/accounts/infrastructure/persistence/mikro-orm/accounts.persistence-module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { TokenEncryption } from './token-encryption';

@Module({
  imports: [
    AccountsPersistenceModule,
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, JwtAuthGuard, TokenEncryption],
  controllers: [AuthController],
  exports: [JwtAuthGuard, JwtModule, TokenEncryption],
})
export class AuthModule {}
