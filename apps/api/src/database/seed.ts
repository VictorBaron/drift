import 'dotenv/config';

import { MikroORM } from '@mikro-orm/postgresql';

import config from '../../mikro-orm.config';
import { Member } from '../core/accounts/domain/aggregates/member.aggregate';
import { Organization } from '../core/accounts/domain/aggregates/organization.aggregate';
import { MemberMapper } from '../core/accounts/infrastructure/persistence/mikro-orm/mappers/member.mapper';
import { OrganizationMapper } from '../core/accounts/infrastructure/persistence/mikro-orm/mappers/organization.mapper';
import { Project } from '../core/projects/domain/aggregates/project.aggregate';
import { ProjectMapper } from '../core/projects/infrastructure/persistence/mikro-orm/mappers/project.mapper';

async function seed() {
  const orm = await MikroORM.init(config);
  const em = orm.em.fork();

  try {
    console.log('Seeding database...');

    // Organization
    // Dev-only seed: slackBotToken is a fake placeholder and is intentionally unencrypted.
    // In production, tokens are encrypted via TokenEncryption before being stored.
    const org = Organization.create({
      name: 'Acme Corp',
      slackTeamId: 'T_TEST',
      slackBotToken: 'xoxb-test-bot-token',
    });

    await em.upsert(OrganizationMapper.toPersistence(org));

    // Admin member (CTO)
    const cto = Member.create({
      email: 'cto@acme.com',
      name: 'Alice Chen',
      slackUserId: 'U_CTO_TEST',
      avatarUrl: null,
      role: 'admin',
      organizationId: org.getId(),
    });

    await em.upsert(MemberMapper.toPersistence(cto));

    // Project 1: Checkout Revamp
    const checkout = Project.create({
      name: 'Checkout Revamp',
      emoji: '🛒',
      organizationId: org.getId(),
      pmLeadName: 'Bob Martin',
      techLeadName: 'Alice Chen',
      teamName: 'Commerce',
      weekNumber: 8,
    });

    checkout.setProductObjective(
      'Reduce checkout drop-off rate from 34% to under 20% by simplifying the payment flow',
      'Q1 OKR — Growth',
      [
        { text: 'Drop-off rate < 20%', done: false },
        { text: 'Payment step < 3 clicks', done: true },
        { text: 'Mobile conversion +15%', done: false },
      ],
    );

    // Project 2: Search Rewrite
    const search = Project.create({
      name: 'Search Rewrite',
      emoji: '🔍',
      organizationId: org.getId(),
      pmLeadName: 'Carol White',
      techLeadName: 'Dave Kim',
      teamName: 'Discovery',
      weekNumber: 8,
    });

    search.setProductObjective(
      'Rebuild search engine on Elasticsearch to support semantic search and cut p99 latency to < 200ms',
      'Tech debt + Growth enabler',
      [
        { text: 'p99 latency < 200ms', done: false },
        { text: 'Semantic search live for 10% of users', done: false },
        { text: 'Zero downtime migration', done: true },
      ],
    );

    // Project 3: Onboarding V2
    const onboarding = Project.create({
      name: 'Onboarding V2',
      emoji: '🚀',
      organizationId: org.getId(),
      pmLeadName: 'Eve Torres',
      techLeadName: 'Frank Liu',
      teamName: 'Growth',
      weekNumber: 8,
    });

    onboarding.setProductObjective(
      'Redesign onboarding flow to increase activation rate (first value moment within 24h) from 41% to 60%',
      'Q1 OKR — Activation',
      [
        { text: 'Activation rate > 60%', done: false },
        { text: 'Time-to-first-value < 10 min', done: false },
        { text: 'Onboarding NPS > 50', done: false },
      ],
    );

    await em.upsert(ProjectMapper.toPersistence(checkout));
    await em.upsert(ProjectMapper.toPersistence(search));
    await em.upsert(ProjectMapper.toPersistence(onboarding));

    await em.flush();

    console.log('✓ Organization: Acme Corp');
    console.log('✓ Member: Alice Chen (CTO, admin)');
    console.log('✓ Project: Checkout Revamp');
    console.log('✓ Project: Search Rewrite');
    console.log('✓ Project: Onboarding V2');
    console.log('Seed complete.');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await orm.close();
  }
}

seed();
