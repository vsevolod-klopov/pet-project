import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Family } from './entities/family.entity';
import { FamilyMember } from './entities/family-member.entity';
import { Goal } from './entities/goal.entity';
import { GoalImage } from './entities/goal-image.entity';
import { GoalStep } from './entities/goal-step.entity';
import { GoalTag } from './entities/goal-tag.entity';
import { GoalDescriptionBlock } from './entities/goal-description-block.entity';
import { Wish } from './entities/wish.entity';
import { User } from '../database/entities/user.entity';
import {
  DEMO_DAD_USER_ID,
  DEMO_FAMILY_ID,
  DEMO_GOAL_ITALY_ID,
  DEMO_GOAL_LIVING_ID,
  DEMO_GOAL_SAFETY_ID,
  DEMO_KID_USER_ID,
  DEMO_MOM_USER_ID,
  DEMO_OWNER_ID,
} from './seed/demo-ids';

const PLACEHOLDER_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

@Injectable()
export class CatalogSeedService implements OnModuleInit {
  private readonly logger = new Logger(CatalogSeedService.name);

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Family) private readonly families: Repository<Family>,
    @InjectRepository(FamilyMember) private readonly members: Repository<FamilyMember>,
    @InjectRepository(Goal) private readonly goals: Repository<Goal>,
    @InjectRepository(GoalImage) private readonly goalImages: Repository<GoalImage>,
    @InjectRepository(GoalStep) private readonly goalSteps: Repository<GoalStep>,
    @InjectRepository(GoalTag) private readonly goalTags: Repository<GoalTag>,
    @InjectRepository(GoalDescriptionBlock)
    private readonly goalDescriptions: Repository<GoalDescriptionBlock>,
    @InjectRepository(Wish) private readonly wishes: Repository<Wish>,
  ) {}

  async onModuleInit(): Promise<void> {
    const count = await this.goals.count();
    if (count > 0) {
      return;
    }

    this.logger.log('Seeding demo catalog data...');
    await this.seed();
    this.logger.log('Demo catalog data seeded.');
  }

  private async seed(): Promise<void> {
    await this.users.save([
      {
        id: DEMO_OWNER_ID,
        name: 'Демо семья',
        email: 'demo-owner@pet.local',
        passwordHash: PLACEHOLDER_HASH,
      },
      {
        id: DEMO_MOM_USER_ID,
        name: 'Мама',
        email: 'demo-mom@pet.local',
        passwordHash: PLACEHOLDER_HASH,
      },
      {
        id: DEMO_DAD_USER_ID,
        name: 'Папа',
        email: 'demo-dad@pet.local',
        passwordHash: PLACEHOLDER_HASH,
      },
      {
        id: DEMO_KID_USER_ID,
        name: 'Аня',
        email: 'demo-kid@pet.local',
        passwordHash: PLACEHOLDER_HASH,
      },
    ]);

    await this.families.save({
      id: DEMO_FAMILY_ID,
      name: 'Демо семья',
      ownerId: DEMO_OWNER_ID,
    });

    await this.members.save([
      {
        familyId: DEMO_FAMILY_ID,
        userId: DEMO_MOM_USER_ID,
        displayName: 'Мама',
        initials: 'М',
        subtitle: 'Любит уют, книги и чай',
        description:
          'Идеи уютных подарков, книги, вещи для дома и небольшие радости «просто так».',
        gradient: 'alt',
        role: 'member',
        legacyKey: 'mom',
      },
      {
        familyId: DEMO_FAMILY_ID,
        userId: DEMO_DAD_USER_ID,
        displayName: 'Папа',
        initials: 'П',
        subtitle: 'Техника, инструменты, хобби',
        description:
          'Гаджеты, инструменты в мастерскую, аксессуары для хобби и активного отдыха.',
        gradient: 'base',
        role: 'member',
        legacyKey: 'dad',
      },
      {
        familyId: DEMO_FAMILY_ID,
        userId: DEMO_KID_USER_ID,
        displayName: 'Аня',
        initials: 'А',
        subtitle: 'Игрушки, творчество, игры',
        description:
          'Настольные игры, наборы для творчества, мягкие игрушки и другие радости для детства.',
        gradient: 'alt',
        role: 'member',
        legacyKey: 'kid',
      },
    ]);

    await this.goals.save([
      {
        id: DEMO_GOAL_ITALY_ID,
        familyId: DEMO_FAMILY_ID,
        legacyKey: 'italy',
        title: 'Большое семейное путешествие в Италию',
        short:
          'Тёплое море, старинные города, совместные прогулки и долгие ужины всей семьёй — представить это всё на одной цели.',
        category: 'Путешествия',
        horizon: '1–2 года',
        status: 'В процессе',
        ownersLabel: 'Вся семья',
        progress: 30,
        coverImage:
          'https://images.pexels.com/photos/3860094/pexels-photo-3860094.jpeg?auto=compress&cs=tinysrgb&w=800',
        coverAlt: 'Семья рассматривает карту путешествий',
        heroImage:
          'https://images.pexels.com/photos/2696469/pexels-photo-2696469.jpeg?auto=compress&cs=tinysrgb&w=1200',
        heroAlt: 'Коллаж с морем, архитектурой и итальянскими улочками',
        feeling:
          'Главное ощущение от цели: лёгкость, интерес, предвкушение. Не про спешку и «надо», а про красивый общий опыт.',
      },
      {
        id: DEMO_GOAL_LIVING_ID,
        familyId: DEMO_FAMILY_ID,
        legacyKey: 'livingroom',
        title: 'Обновить гостиную и сделать уголок мечты',
        short:
          'Лёгкие пастельные стены, удобный диван, растения, место для чтения и семейных фильмов по вечерам.',
        category: 'Дом и уют',
        horizon: '6–12 месяцев',
        status: 'В начале',
        ownersLabel: 'Вся семья',
        progress: 10,
        coverImage:
          'https://images.pexels.com/photos/7018390/pexels-photo-7018390.jpeg?auto=compress&cs=tinysrgb&w=800',
        coverAlt: 'Современная светлая гостиная',
        heroImage:
          'https://images.pexels.com/photos/7018390/pexels-photo-7018390.jpeg?auto=compress&cs=tinysrgb&w=1200',
        heroAlt: 'Современная светлая гостиная',
        feeling: 'Ощущение: спокойствие, тепло и «дом как место силы».',
      },
      {
        id: DEMO_GOAL_SAFETY_ID,
        familyId: DEMO_FAMILY_ID,
        legacyKey: 'safety',
        title: 'Подушка безопасности для всей семьи',
        short:
          'Накопить комфортный резерв, чтобы спокойно чувствовать себя в любых бытовых ситуациях и планировать большие шаги.',
        category: 'Финансы',
        horizon: '2–3 года',
        status: 'В процессе',
        ownersLabel: 'Вся семья',
        progress: 45,
        coverImage:
          'https://images.pexels.com/photos/8293779/pexels-photo-8293779.jpeg?auto=compress&cs=tinysrgb&w=800',
        coverAlt: 'Копилка и деревянный домик',
        heroImage:
          'https://images.pexels.com/photos/8293779/pexels-photo-8293779.jpeg?auto=compress&cs=tinysrgb&w=1200',
        heroAlt: 'Копилка и деревянный домик',
        feeling: 'Ощущение: уверенность и защищённость.',
      },
    ]);

    await this.goalImages.save([
      {
        goalId: DEMO_GOAL_ITALY_ID,
        src: 'https://images.pexels.com/photos/208745/pexels-photo-208745.jpeg?auto=compress&cs=tinysrgb&w=800',
        alt: 'Морское побережье',
        sortOrder: 0,
      },
      {
        goalId: DEMO_GOAL_ITALY_ID,
        src: 'https://images.pexels.com/photos/460672/pexels-photo-460672.jpeg?auto=compress&cs=tinysrgb&w=800',
        alt: 'Итальянский город',
        sortOrder: 1,
      },
      {
        goalId: DEMO_GOAL_ITALY_ID,
        src: 'https://images.pexels.com/photos/1525041/pexels-photo-1525041.jpeg?auto=compress&cs=tinysrgb&w=800',
        alt: 'Совместный ужин на террасе',
        sortOrder: 2,
      },
      {
        goalId: DEMO_GOAL_ITALY_ID,
        src: 'https://images.pexels.com/photos/1650888/pexels-photo-1650888.jpeg?auto=compress&cs=tinysrgb&w=800',
        alt: 'Мороженое и прогулка по улицам',
        sortOrder: 3,
      },
    ]);

    await this.goalDescriptions.save([
      {
        goalId: DEMO_GOAL_ITALY_ID,
        text: 'Представить: тёплое море, каменные улицы, кафе с видом на закат, долгие прогулки, новые вкусы и впечатления. Важно, чтобы поездка была спокойной, без спешки и с возможностью проводить много времени вместе.',
        sortOrder: 0,
      },
      {
        goalId: DEMO_GOAL_ITALY_ID,
        text: 'Цель — не только «съездить в Италию», а прожить этот опыт как семейное событие, к которому приятно готовиться: выбирать места, планировать маршруты, потихоньку учить несколько фраз на итальянском, откладывать деньги и радоваться каждому шагу ближе.',
        sortOrder: 1,
      },
      {
        goalId: DEMO_GOAL_LIVING_ID,
        text: 'Сделать гостиную светлой и спокойной: пастельные оттенки, мягкий текстиль, уютный свет, растения. Место, куда хочется возвращаться.',
        sortOrder: 0,
      },
      {
        goalId: DEMO_GOAL_SAFETY_ID,
        text: 'Постепенно сформировать резерв: пусть цель растёт спокойно и незаметно, но регулярно. Это про уверенность и свободу планировать.',
        sortOrder: 0,
      },
    ]);

    await this.goalSteps.save([
      {
        goalId: DEMO_GOAL_ITALY_ID,
        userId: DEMO_MOM_USER_ID,
        text: 'Нашли красивый референс по Риму — хочется гулять по улочкам без спешки.',
        status: 'spark',
        image:
          'https://images.pexels.com/photos/460672/pexels-photo-460672.jpeg?auto=compress&cs=tinysrgb&w=800',
        imageAlt: 'Итальянский город',
        sortOrder: 0,
      },
      {
        goalId: DEMO_GOAL_ITALY_ID,
        userId: DEMO_DAD_USER_ID,
        text: 'Собрал примерный бюджет на перелёт и жильё — выглядит реально за 1–2 года.',
        status: 'plan',
        sortOrder: 1,
      },
      {
        goalId: DEMO_GOAL_ITALY_ID,
        userId: DEMO_KID_USER_ID,
        text: 'Хочу мороженое на набережной и катание на лодке!',
        status: 'doing',
        image:
          'https://images.pexels.com/photos/1650888/pexels-photo-1650888.jpeg?auto=compress&cs=tinysrgb&w=800',
        imageAlt: 'Мороженое и прогулка',
        sortOrder: 2,
      },
      {
        goalId: DEMO_GOAL_LIVING_ID,
        userId: DEMO_MOM_USER_ID,
        text: 'Выбрали пастельные оттенки для стен — уже представляю вечера с пледом.',
        status: 'plan',
        sortOrder: 0,
      },
      {
        goalId: DEMO_GOAL_SAFETY_ID,
        userId: DEMO_DAD_USER_ID,
        text: 'Настроили автоперевод на накопительный счёт каждый месяц.',
        status: 'done',
        sortOrder: 0,
      },
    ]);

    await this.goalTags.save([
      { goalId: DEMO_GOAL_ITALY_ID, tag: 'Вдохновение' },
      { goalId: DEMO_GOAL_ITALY_ID, tag: 'Совместное время' },
      { goalId: DEMO_GOAL_ITALY_ID, tag: 'Новые впечатления' },
      { goalId: DEMO_GOAL_LIVING_ID, tag: 'Уют' },
      { goalId: DEMO_GOAL_LIVING_ID, tag: 'Дом' },
      { goalId: DEMO_GOAL_LIVING_ID, tag: 'Ремонт' },
      { goalId: DEMO_GOAL_SAFETY_ID, tag: 'Спокойствие' },
      { goalId: DEMO_GOAL_SAFETY_ID, tag: 'Планирование' },
    ]);

    const wishRows: Partial<Wish>[] = [
      {
        userId: DEMO_MOM_USER_ID,
        familyId: DEMO_FAMILY_ID,
        legacyKey: 'mom-book',
        title: 'Книга по любимой теме',
        description:
          'Тёплая книга для вечеров с чаем. Можно выбрать нон‑фикшн или уютный роман — главное, чтобы было интересно и спокойно.',
        category: 'Книги',
        budget: 'до 2 000 ₽',
        link: 'https://пример‑магазина.ru/book',
        image:
          'https://images.pexels.com/photos/204692/pexels-photo-204692.jpeg?auto=compress&cs=tinysrgb&w=800',
        alt: 'Книги и чашка чая на столе',
        visibility: 'family',
      },
      {
        userId: DEMO_MOM_USER_ID,
        familyId: DEMO_FAMILY_ID,
        legacyKey: 'mom-blanket',
        title: 'Мягкий плед в пастельных тонах',
        description:
          'Лёгкий, но тёплый плед под фильмы и чтение. Нежные цвета без ярких рисунков.',
        category: 'Дом и уют',
        budget: 'до 3 500 ₽',
        link: 'https://пример‑магазина.ru/blanket',
        image:
          'https://images.pexels.com/photos/3738797/pexels-photo-3738797.jpeg?auto=compress&cs=tinysrgb&w=800',
        alt: 'Мягкий плед и подушка на диване',
        visibility: 'family',
      },
      {
        userId: DEMO_MOM_USER_ID,
        familyId: DEMO_FAMILY_ID,
        legacyKey: 'mom-mugs',
        title: 'Красивый набор кружек',
        description:
          'Пара керамических кружек для утреннего кофе и вечернего чая, чтобы каждое чаепитие было маленьким ритуалом.',
        category: 'Посуда',
        budget: 'до 2 500 ₽',
        link: 'https://пример‑магазина.ru/mugs',
        image:
          'https://images.pexels.com/photos/3736397/pexels-photo-3736397.jpeg?auto=compress&cs=tinysrgb&w=800',
        alt: 'Набор керамических кружек',
        visibility: 'family',
      },
      {
        userId: DEMO_DAD_USER_ID,
        familyId: DEMO_FAMILY_ID,
        legacyKey: 'dad-headphones',
        title: 'Беспроводные наушники',
        description:
          'Удобно для прогулок, работы и поездок. Важно, чтобы были комфортные амбушюры и хорошая автономность.',
        category: 'Техника',
        budget: 'до 8 000 ₽',
        link: 'https://пример‑магазина.ru/headphones',
        image:
          'https://images.pexels.com/photos/3822843/pexels-photo-3822843.jpeg?auto=compress&cs=tinysrgb&w=800',
        alt: 'Наушники на столе',
        visibility: 'family',
      },
      {
        userId: DEMO_DAD_USER_ID,
        familyId: DEMO_FAMILY_ID,
        legacyKey: 'dad-tools',
        title: 'Набор качественных инструментов',
        description:
          'Организованный набор для мелкого ремонта и проектов дома, чтобы всё было под рукой.',
        category: 'Инструменты',
        budget: 'до 6 000 ₽',
        link: 'https://пример‑магазина.ru/tools',
        image:
          'https://images.pexels.com/photos/3965448/pexels-photo-3965448.jpeg?auto=compress&cs=tinysrgb&w=800',
        alt: 'Набор инструментов в ящике',
        visibility: 'family',
      },
      {
        userId: DEMO_DAD_USER_ID,
        familyId: DEMO_FAMILY_ID,
        legacyKey: 'dad-notebook',
        title: 'Блокнот для идей',
        description:
          'Стильный блокнот, куда можно записывать мысли, планы, идеи для проектов и заметки.',
        category: 'Аксессуары',
        budget: 'до 1 500 ₽',
        link: 'https://пример‑магазина.ru/notebook',
        image:
          'https://images.pexels.com/photos/4870781/pexels-photo-4870781.jpeg?auto=compress&cs=tinysrgb&w=800',
        alt: 'Человек, пишущий в блокнот',
        visibility: 'family',
      },
      {
        userId: DEMO_KID_USER_ID,
        familyId: DEMO_FAMILY_ID,
        legacyKey: 'kid-boardgame',
        title: 'Новая настольная игра',
        description: 'Весёлая семейная игра, в которую можно играть вечерами всем вместе.',
        category: 'Игры',
        budget: 'до 3 000 ₽',
        link: 'https://пример‑магазина.ru/boardgame',
        image:
          'https://images.pexels.com/photos/3661383/pexels-photo-3661383.jpeg?auto=compress&cs=tinysrgb&w=800',
        alt: 'Настольная игра на столе',
        visibility: 'family',
      },
      {
        userId: DEMO_KID_USER_ID,
        familyId: DEMO_FAMILY_ID,
        legacyKey: 'kid-art',
        title: 'Набор для творчества',
        description:
          'Краски, фломастеры и наклейки — чтобы можно было рисовать, вырезать и придумывать свои миры.',
        category: 'Творчество',
        budget: 'до 2 000 ₽',
        link: 'https://пример‑магазина.ru/art-set',
        image:
          'https://images.pexels.com/photos/4144294/pexels-photo-4144294.jpeg?auto=compress&cs=tinysrgb&w=800',
        alt: 'Набор для рисования',
        visibility: 'family',
      },
      {
        userId: DEMO_KID_USER_ID,
        familyId: DEMO_FAMILY_ID,
        legacyKey: 'kid-plush',
        title: 'Мягкая игрушка',
        description:
          'Маленький мягкий друг, которого можно брать с собой в поездки и укладывать спать рядом.',
        category: 'Игрушки',
        budget: 'до 2 000 ₽',
        link: 'https://пример‑магазина.ru/plush',
        image:
          'https://images.pexels.com/photos/3662875/pexels-photo-3662875.jpeg?auto=compress&cs=tinysrgb&w=800',
        alt: 'Мягкая игрушка в детской',
        visibility: 'family',
      },
    ];

    await this.wishes.save(wishRows);
  }
}
