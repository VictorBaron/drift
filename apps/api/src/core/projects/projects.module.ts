import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AccountsPersistenceModule } from '@/accounts/infrastructure/persistence/mikro-orm/accounts.persistence-module';
import { SLACK_API_GATEWAY } from '@/integrations/slack/domain/gateways/slack-api.gateway';
import { WebApiSlackGateway } from '@/integrations/slack/infrastructure/gateways/web-api-slack.gateway';
import { CreateProjectHandler } from './application/commands/create-project/create-project.handler';
import { ProjectRepository } from './domain/repositories/project.repository';
import { ProjectsController } from './infrastructure/controllers/projects.controller';
import { ProjectMikroOrm } from './infrastructure/persistence/mikro-orm/models/project.mikroORM';
import { ProjectRepositoryMikroOrm } from './infrastructure/persistence/mikro-orm/project.repository.mikroORM';

@Module({
  imports: [CqrsModule, MikroOrmModule.forFeature([ProjectMikroOrm]), AccountsPersistenceModule],
  controllers: [ProjectsController],
  providers: [
    CreateProjectHandler,
    { provide: ProjectRepository, useClass: ProjectRepositoryMikroOrm },
    { provide: SLACK_API_GATEWAY, useClass: WebApiSlackGateway },
  ],
  exports: [ProjectRepository],
})
export class ProjectsModule {}
