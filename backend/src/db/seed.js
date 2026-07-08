import bcrypt from 'bcryptjs';
import { db } from './index.js';
import { generateFifaSoulId } from '../services/identity.js';

const userCount = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;

if (userCount === 0) {
  console.log('Seeding database...');

  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password_hash, role, points, wins, losses, ticket_balance, xp, season_points, grade, fifa_soul_id, psn_id)
    VALUES (@name, @email, @password_hash, @role, @points, @wins, @losses, @ticket_balance, @xp, @season_points, @grade, @fifa_soul_id, @psn_id)
  `);

  const passwordHash = bcrypt.hashSync('password123', 10);
  const adminHash = bcrypt.hashSync('admin123', 10);

  const members = [
    { name: 'Mamad Fifa', email: 'mamad@fifasoul.test', points: 980, wins: 41, losses: 6, season_points: 665, grade: 'A', psn_id: 'mamad_fifa_psn' },
    { name: 'Hamid k2', email: 'hamid@fifasoul.test', points: 870, wins: 33, losses: 9, season_points: 490, grade: 'B', psn_id: 'hamid_k2_psn' },
    { name: 'Amin 32', email: 'amin@fifasoul.test', points: 810, wins: 30, losses: 11, season_points: 380, grade: 'C', psn_id: 'amin_32_psn' },
    { name: 'Navid game', email: 'navid@fifasoul.test', points: 790, wins: 28, losses: 10, season_points: 260, grade: 'D', psn_id: null },
    { name: 'reza toyota', email: 'reza@fifasoul.test', points: 640, wins: 22, losses: 14, season_points: 140, grade: 'D', psn_id: null },
  ];

  const memberIds = {};
  for (const m of members) {
    const info = insertUser.run({
      name: m.name,
      email: m.email,
      password_hash: passwordHash,
      role: 'member',
      points: m.points,
      wins: m.wins,
      losses: m.losses,
      ticket_balance: 10, // demo credit so h2h create/join flows can be tested end-to-end
      xp: m.season_points,
      season_points: m.season_points,
      grade: m.grade,
      fifa_soul_id: generateFifaSoulId(),
      psn_id: m.psn_id,
    });
    memberIds[m.name] = info.lastInsertRowid;
  }

  const adminInfo = insertUser.run({
    name: 'مدیر سایت',
    email: 'admin@fifasoul.test',
    password_hash: adminHash,
    role: 'senior_admin',
    points: 0,
    wins: 0,
    losses: 0,
    ticket_balance: 0,
    xp: 0,
    season_points: 0,
    grade: 'D',
    fifa_soul_id: generateFifaSoulId(),
    psn_id: null,
  });

  // A writer (news/tutorials) and a match_expert (h2h dispute queue) so the
  // multi-tier admin roles have someone to log in and test with beyond the
  // one senior_admin account.
  insertUser.run({
    name: 'نویسنده سایت',
    email: 'writer@fifasoul.test',
    password_hash: adminHash,
    role: 'writer',
    points: 0,
    wins: 0,
    losses: 0,
    ticket_balance: 0,
    xp: 0,
    season_points: 0,
    grade: 'D',
    fifa_soul_id: generateFifaSoulId(),
    psn_id: null,
  });

  insertUser.run({
    name: 'کارشناس مسابقات',
    email: 'expert@fifasoul.test',
    password_hash: adminHash,
    role: 'match_expert',
    points: 0,
    wins: 0,
    losses: 0,
    ticket_balance: 0,
    xp: 0,
    season_points: 0,
    grade: 'D',
    fifa_soul_id: generateFifaSoulId(),
    psn_id: null,
  });

  const insertTournament = db.prepare(`
    INSERT INTO tournaments (title, type, description, status, entry_fee, max_players, start_date, created_by)
    VALUES (@title, @type, @description, @status, @entry_fee, @max_players, @start_date, @created_by)
  `);

  const t1 = insertTournament.run({
    title: 'لیگ ستارگان FIFA Soul فصل ۳',
    type: 'league',
    description: 'رقابت ۱۶ بازیکن برتر در قالب لیگ رفت و برگشت با پخش زنده مسابقات.',
    status: 'in_progress',
    entry_fee: 50000,
    max_players: 16,
    start_date: '2026-06-01',
    created_by: adminInfo.lastInsertRowid,
  });

  const t2 = insertTournament.run({
    title: 'کاپ حذفی پاییزه',
    type: 'cup',
    description: 'مسابقه حذفی تک‌بازی با جوایز نقدی برای نفرات برتر.',
    status: 'upcoming',
    entry_fee: 30000,
    max_players: 32,
    start_date: '2026-08-15',
    created_by: adminInfo.lastInsertRowid,
  });

  const insertMatch = db.prepare(`
    INSERT INTO matches (tournament_id, home_user_id, away_user_id, home_name, away_name, home_score, away_score, status, category, scheduled_at)
    VALUES (@tournament_id, @home_user_id, @away_user_id, @home_name, @away_name, @home_score, @away_score, @status, @category, @scheduled_at)
  `);

  insertMatch.run({
    tournament_id: t1.lastInsertRowid,
    home_user_id: memberIds['Mamad Fifa'],
    away_user_id: memberIds['reza toyota'],
    home_name: 'Mamad Fifa',
    away_name: 'reza toyota',
    home_score: null,
    away_score: null,
    status: 'in_progress',
    category: 'ro_dero',
    scheduled_at: '2026-07-04 20:00',
  });

  insertMatch.run({
    tournament_id: t1.lastInsertRowid,
    home_user_id: memberIds['Mamad Fifa'],
    away_user_id: null,
    home_name: 'Mamad Fifa',
    away_name: null,
    home_score: null,
    away_score: null,
    status: 'waiting',
    category: 'play_off',
    scheduled_at: null,
  });

  insertMatch.run({
    tournament_id: t2.lastInsertRowid,
    home_user_id: memberIds['Hamid k2'],
    away_user_id: memberIds['Amin 32'],
    home_name: 'Hamid k2',
    away_name: 'Amin 32',
    home_score: 3,
    away_score: 1,
    status: 'finished',
    category: 'ro_dero',
    scheduled_at: '2026-06-20 18:00',
  });

  const insertNews = db.prepare(`
    INSERT INTO news (title, excerpt, body, cover_image, category, author_id)
    VALUES (@title, @excerpt, @body, @cover_image, @category, @author_id)
  `);

  const newsItems = [
    {
      title: 'شروع فصل جدید لیگ ستارگان',
      excerpt: 'تیم پرسپولیس متن سادگی با تولید سادگی متن و استفاده از طراحی گرافیک است.',
      category: 'active_games',
    },
    {
      title: 'برترین گیمرهای هفته معرفی شدند',
      excerpt: 'صنعت چاپ و با استفاده از طراحی گرافیک، متن‌ها را به‌روزرسانی کرده‌ایم.',
      category: 'popular',
    },
    {
      title: 'قوانین جدید کاپ حذفی پاییزه',
      excerpt: 'در این مطلب با آخرین تغییرات قوانین برگزاری مسابقات آشنا شوید.',
      category: 'newest',
    },
    {
      title: 'آموزش ثبت‌نام و ورود به تورنمنت‌ها',
      excerpt: 'راهنمای گام‌به‌گام برای شرکت در اولین مسابقه خود در فیفاسول.',
      category: 'tutorial',
    },
  ];

  for (const n of newsItems) {
    insertNews.run({
      title: n.title,
      excerpt: n.excerpt,
      body: n.excerpt,
      cover_image: null,
      category: n.category,
      author_id: adminInfo.lastInsertRowid,
    });
  }

  console.log('Seed complete. Admin login: admin@fifasoul.test / admin123');
} else {
  console.log('Database already has data, skipping seed.');
}

const gradeThresholdCount = db.prepare('SELECT COUNT(*) AS c FROM grade_thresholds').get().c;
if (gradeThresholdCount === 0) {
  const insertGrade = db.prepare(
    'INSERT INTO grade_thresholds (grade, min_points, max_points) VALUES (?, ?, ?)'
  );
  insertGrade.run('D', 0, 299);
  insertGrade.run('C', 300, 449);
  insertGrade.run('B', 450, 599);
  insertGrade.run('A', 600, null);
  console.log('Seeded default grade thresholds (D/C/B/A).');
}

const gameOptionCount = db.prepare('SELECT COUNT(*) AS c FROM game_options').get().c;
if (gameOptionCount === 0) {
  const insertOption = db.prepare(
    'INSERT INTO game_options (category, value, label, sort_order) VALUES (?, ?, ?, ?)'
  );
  [
    ['pc', 'PC'],
    ['xbox', 'Xbox'],
    ['ps4', 'PlayStation 4'],
  ].forEach(([value, label], i) => insertOption.run('console', value, label, i));
  [
    ['fifa18', 'FIFA 18'],
    ['fifa19', 'FIFA 19'],
    ['pes18', 'PES 18'],
    ['pes19', 'PES 19'],
  ].forEach(([value, label], i) => insertOption.run('game_version', value, label, i));
  console.log('Seeded default game options (console/game_version).');
}

const vipThreshold = db.prepare("SELECT value FROM app_settings WHERE key = 'vip_xp_threshold'").get();
if (!vipThreshold) {
  db.prepare("INSERT INTO app_settings (key, value) VALUES ('vip_xp_threshold', '500')").run();
  console.log('Seeded default VIP XP threshold (500).');
}

const h2hTimeLimit = db.prepare("SELECT value FROM app_settings WHERE key = 'h2h_default_time_limit_hours'").get();
if (!h2hTimeLimit) {
  db.prepare("INSERT INTO app_settings (key, value) VALUES ('h2h_default_time_limit_hours', '24')").run();
  db.prepare("INSERT INTO app_settings (key, value) VALUES ('h2h_forfeit_dispute_window_hours', '1')").run();
  console.log('Seeded default h2h time-limit settings (24h play window, 1h forfeit-dispute window).');
}

const messagingEnabled = db.prepare("SELECT value FROM app_settings WHERE key = 'messaging_enabled'").get();
if (!messagingEnabled) {
  db.prepare("INSERT INTO app_settings (key, value) VALUES ('messaging_enabled', '1')").run();
  console.log('Seeded default messaging_enabled setting (on).');
}

const ticketToTomanRate = db.prepare("SELECT value FROM app_settings WHERE key = 'ticket_to_toman_rate'").get();
if (!ticketToTomanRate) {
  db.prepare("INSERT INTO app_settings (key, value) VALUES ('ticket_to_toman_rate', '10000')").run();
  console.log('Seeded default ticket-to-toman withdrawal rate (10,000 per ticket).');
}

const paymentMethodCount = db.prepare('SELECT COUNT(*) AS c FROM payment_methods').get().c;
if (paymentMethodCount === 0) {
  db.prepare(
    `INSERT INTO payment_methods (type, title, card_number, card_holder_name, fee_percent, fee_fixed, min_amount, sort_order)
     VALUES ('card_to_card', 'کارت به کارت', '6037-9975-1234-5678', 'مدیریت فیفاسول', 1.5, 0, 20000, 0)`
  ).run();
  db.prepare(
    `INSERT INTO payment_methods (type, title, iban, account_holder_name, bank_name, fee_percent, fee_fixed, min_amount, sort_order)
     VALUES ('bank_account', 'واریز به حساب بانکی', 'IR820540102680020817909002', 'مدیریت فیفاسول', 'بانک پاسارگاد', 0, 0, 20000, 1)`
  ).run();
  console.log('Seeded default payment methods (card-to-card, bank account).');
}
