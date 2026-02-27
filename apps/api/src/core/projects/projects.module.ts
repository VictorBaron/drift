import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { ProjectRepository } from './domain/repositories/project.repository';
import { ProjectsController } from './infrastructure/controllers/projects.controller';
import { ProjectMikroOrm } from './infrastructure/persistence/mikro-orm/models/project.mikroORM';
import { ProjectRepositoryMikroOrm } from './infrastructure/persistence/mikro-orm/project.repository.mikroORM';

@Module({
  imports: [CqrsModule, MikroOrmModule.forFeature([ProjectMikroOrm])],
  controllers: [ProjectsController],
  providers: [{ provide: ProjectRepository, useClass: ProjectRepositoryMikroOrm }],
  exports: [ProjectRepository],
})
export class ProjectsModule {}
