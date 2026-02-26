import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { PersistenceModule } from 'common/persistence-module';
import { ProjectRepository } from '@/projects/domain/repositories/project.repository';
import { ProjectMikroOrm } from './mikro-orm/models/project.mikroORM';
import { ProjectRepositoryMikroOrm } from './mikro-orm/project.repository.mikroORM';

@Module({
  imports: [MikroOrmModule.forFeature([ProjectMikroOrm]), PersistenceModule],
  providers: [
    {
      provide: ProjectRepository,
      useClass: ProjectRepositoryMikroOrm,
    },
  ],
  exports: [ProjectRepository],
})
export class ProjectsPersistenceModule {}
