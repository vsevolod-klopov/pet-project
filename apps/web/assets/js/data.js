// Единый источник данных для макета.
// Позже ты можешь заменить это на fetch(...) к своему бэкенду,
// сохранив форму данных (или сделать адаптер).

window.APP_DATA = {
  goals: [
    {
      id: "italy",
      title: "Большое семейное путешествие в Италию",
      short:
        "Тёплое море, старинные города, совместные прогулки и долгие ужины всей семьёй — представить это всё на одной цели.",
      category: "Путешествия",
      horizon: "1–2 года",
      status: "В процессе",
      owners: "Вся семья",
      progress: 30,
      coverImage:
        "https://images.pexels.com/photos/3860094/pexels-photo-3860094.jpeg?auto=compress&cs=tinysrgb&w=800",
      coverAlt: "Семья рассматривает карту путешествий",
      heroImage:
        "https://images.pexels.com/photos/2696469/pexels-photo-2696469.jpeg?auto=compress&cs=tinysrgb&w=1200",
      heroAlt: "Коллаж с морем, архитектурой и итальянскими улочками",
      gallery: [
        {
          src: "https://images.pexels.com/photos/208745/pexels-photo-208745.jpeg?auto=compress&cs=tinysrgb&w=800",
          alt: "Морское побережье",
        },
        {
          src: "https://images.pexels.com/photos/460672/pexels-photo-460672.jpeg?auto=compress&cs=tinysrgb&w=800",
          alt: "Итальянский город",
        },
        {
          src: "https://images.pexels.com/photos/1525041/pexels-photo-1525041.jpeg?auto=compress&cs=tinysrgb&w=800",
          alt: "Совместный ужин на террасе",
        },
        {
          src: "https://images.pexels.com/photos/1650888/pexels-photo-1650888.jpeg?auto=compress&cs=tinysrgb&w=800",
          alt: "Мороженое и прогулка по улицам",
        },
      ],
      description: [
        "Представить: тёплое море, каменные улицы, кафе с видом на закат, долгие прогулки, новые вкусы и впечатления. Важно, чтобы поездка была спокойной, без спешки и с возможностью проводить много времени вместе.",
        "Цель — не только «съездить в Италию», а прожить этот опыт как семейное событие, к которому приятно готовиться: выбирать места, планировать маршруты, потихоньку учить несколько фраз на итальянском, откладывать деньги и радоваться каждому шагу ближе.",
      ],
      steps: [
        "Обсудить примерные даты и длительность поездки",
        "Определиться с городами: Рим, Флоренция, побережье",
        "Понять примерный бюджет и темп накоплений",
        "Собрать подборку мест и вдохновляющих фото",
      ],
      tags: ["Вдохновение", "Совместное время", "Новые впечатления"],
      feeling:
        "Главное ощущение от цели: лёгкость, интерес, предвкушение. Не про спешку и «надо», а про красивый общий опыт.",
    },
    {
      id: "livingroom",
      title: "Обновить гостиную и сделать уголок мечты",
      short:
        "Лёгкие пастельные стены, удобный диван, растения, место для чтения и семейных фильмов по вечерам.",
      category: "Дом и уют",
      horizon: "6–12 месяцев",
      status: "В начале",
      owners: "Вся семья",
      progress: 10,
      coverImage:
        "https://images.pexels.com/photos/7018390/pexels-photo-7018390.jpeg?auto=compress&cs=tinysrgb&w=800",
      coverAlt: "Современная светлая гостиная",
      heroImage:
        "https://images.pexels.com/photos/7018390/pexels-photo-7018390.jpeg?auto=compress&cs=tinysrgb&w=1200",
      heroAlt: "Современная светлая гостиная",
      gallery: [],
      description: [
        "Сделать гостиную светлой и спокойной: пастельные оттенки, мягкий текстиль, уютный свет, растения. Место, куда хочется возвращаться.",
      ],
      steps: ["Собрать референсы", "Определить бюджет", "Составить список покупок"],
      tags: ["Уют", "Дом", "Ремонт"],
      feeling: "Ощущение: спокойствие, тепло и «дом как место силы».",
    },
    {
      id: "safety",
      title: "Подушка безопасности для всей семьи",
      short:
        "Накопить комфортный резерв, чтобы спокойно чувствовать себя в любых бытовых ситуациях и планировать большие шаги.",
      category: "Финансы",
      horizon: "2–3 года",
      status: "В процессе",
      owners: "Вся семья",
      progress: 45,
      coverImage:
        "https://images.pexels.com/photos/8293779/pexels-photo-8293779.jpeg?auto=compress&cs=tinysrgb&w=800",
      coverAlt: "Копилка и деревянный домик",
      heroImage:
        "https://images.pexels.com/photos/8293779/pexels-photo-8293779.jpeg?auto=compress&cs=tinysrgb&w=1200",
      heroAlt: "Копилка и деревянный домик",
      gallery: [],
      description: [
        "Постепенно сформировать резерв: пусть цель растёт спокойно и незаметно, но регулярно. Это про уверенность и свободу планировать.",
      ],
      steps: ["Определить целевую сумму", "Настроить регулярные отчисления", "Отслеживать прогресс"],
      tags: ["Спокойствие", "Планирование"],
      feeling: "Ощущение: уверенность и защищённость.",
    },
  ],

  family: [
    {
      id: "mom",
      name: "Мама",
      initials: "М",
      gradient: "alt",
      subtitle: "Любит уют, книги и чай",
      description:
        "Идеи уютных подарков, книги, вещи для дома и небольшие радости «просто так».",
    },
    {
      id: "dad",
      name: "Папа",
      initials: "П",
      gradient: "base",
      subtitle: "Техника, инструменты, хобби",
      description:
        "Гаджеты, инструменты в мастерскую, аксессуары для хобби и активного отдыха.",
    },
    {
      id: "kid",
      name: "Аня",
      initials: "А",
      gradient: "alt",
      subtitle: "Игрушки, творчество, игры",
      description:
        "Настольные игры, наборы для творчества, мягкие игрушки и другие радости для детства.",
    },
  ],

  wishlists: {
    mom: [
      {
        id: "mom-book",
        title: "Книга по любимой теме",
        description:
          "Тёплая книга для вечеров с чаем. Можно выбрать нон‑фикшн или уютный роман — главное, чтобы было интересно и спокойно.",
        category: "Книги",
        budget: "до 2 000 ₽",
        link: "https://пример‑магазина.ru/book",
        image:
          "https://images.pexels.com/photos/204692/pexels-photo-204692.jpeg?auto=compress&cs=tinysrgb&w=800",
        alt: "Книги и чашка чая на столе",
      },
      {
        id: "mom-blanket",
        title: "Мягкий плед в пастельных тонах",
        description:
          "Лёгкий, но тёплый плед под фильмы и чтение. Нежные цвета без ярких рисунков.",
        category: "Дом и уют",
        budget: "до 3 500 ₽",
        link: "https://пример‑магазина.ru/blanket",
        image:
          "https://images.pexels.com/photos/3738797/pexels-photo-3738797.jpeg?auto=compress&cs=tinysrgb&w=800",
        alt: "Мягкий плед и подушка на диване",
      },
      {
        id: "mom-mugs",
        title: "Красивый набор кружек",
        description:
          "Пара керамических кружек для утреннего кофе и вечернего чая, чтобы каждое чаепитие было маленьким ритуалом.",
        category: "Посуда",
        budget: "до 2 500 ₽",
        link: "https://пример‑магазина.ru/mugs",
        image:
          "https://images.pexels.com/photos/3736397/pexels-photo-3736397.jpeg?auto=compress&cs=tinysrgb&w=800",
        alt: "Набор керамических кружек",
      },
    ],
    dad: [
      {
        id: "dad-headphones",
        title: "Беспроводные наушники",
        description:
          "Удобно для прогулок, работы и поездок. Важно, чтобы были комфортные амбушюры и хорошая автономность.",
        category: "Техника",
        budget: "до 8 000 ₽",
        link: "https://пример‑магазина.ru/headphones",
        image:
          "https://images.pexels.com/photos/3822843/pexels-photo-3822843.jpeg?auto=compress&cs=tinysrgb&w=800",
        alt: "Наушники на столе",
      },
      {
        id: "dad-tools",
        title: "Набор качественных инструментов",
        description:
          "Организованный набор для мелкого ремонта и проектов дома, чтобы всё было под рукой.",
        category: "Инструменты",
        budget: "до 6 000 ₽",
        link: "https://пример‑магазина.ru/tools",
        image:
          "https://images.pexels.com/photos/3965448/pexels-photo-3965448.jpeg?auto=compress&cs=tinysrgb&w=800",
        alt: "Набор инструментов в ящике",
      },
      {
        id: "dad-notebook",
        title: "Блокнот для идей",
        description:
          "Стильный блокнот, куда можно записывать мысли, планы, идеи для проектов и заметки.",
        category: "Аксессуары",
        budget: "до 1 500 ₽",
        link: "https://пример‑магазина.ru/notebook",
        image:
          "https://images.pexels.com/photos/4870781/pexels-photo-4870781.jpeg?auto=compress&cs=tinysrgb&w=800",
        alt: "Человек, пишущий в блокнот",
      },
    ],
    kid: [
      {
        id: "kid-boardgame",
        title: "Новая настольная игра",
        description: "Весёлая семейная игра, в которую можно играть вечерами всем вместе.",
        category: "Игры",
        budget: "до 3 000 ₽",
        link: "https://пример‑магазина.ru/boardgame",
        image:
          "https://images.pexels.com/photos/3661383/pexels-photo-3661383.jpeg?auto=compress&cs=tinysrgb&w=800",
        alt: "Настольная игра на столе",
      },
      {
        id: "kid-art",
        title: "Набор для творчества",
        description:
          "Краски, фломастеры и наклейки — чтобы можно было рисовать, вырезать и придумывать свои миры.",
        category: "Творчество",
        budget: "до 2 000 ₽",
        link: "https://пример‑магазина.ru/art-set",
        image:
          "https://images.pexels.com/photos/4144294/pexels-photo-4144294.jpeg?auto=compress&cs=tinysrgb&w=800",
        alt: "Набор для рисования",
      },
      {
        id: "kid-plush",
        title: "Мягкая игрушка",
        description:
          "Маленький мягкий друг, которого можно брать с собой в поездки и укладывать спать рядом.",
        category: "Игрушки",
        budget: "до 2 000 ₽",
        link: "https://пример‑магазина.ru/plush",
        image:
          "https://images.pexels.com/photos/3662875/pexels-photo-3662875.jpeg?auto=compress&cs=tinysrgb&w=800",
        alt: "Мягкая игрушка в детской",
      },
    ],
  },
};

