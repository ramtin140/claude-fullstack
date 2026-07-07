-- FIFA Soul platform schema

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member', -- 'member' | 'admin'
  avatar TEXT,
  points INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tournaments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'league', -- 'league' | 'cup'
  description TEXT,
  status TEXT NOT NULL DEFAULT 'upcoming', -- 'upcoming' | 'in_progress' | 'finished'
  entry_fee INTEGER NOT NULL DEFAULT 0,
  max_players INTEGER NOT NULL DEFAULT 16,
  start_date TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tournament_participants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(tournament_id, user_id)
);

CREATE TABLE IF NOT EXISTS matches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tournament_id INTEGER REFERENCES tournaments(id) ON DELETE SET NULL,
  home_user_id INTEGER REFERENCES users(id),
  away_user_id INTEGER REFERENCES users(id),
  home_name TEXT,
  away_name TEXT,
  home_score INTEGER,
  away_score INTEGER,
  status TEXT NOT NULL DEFAULT 'waiting', -- 'waiting' | 'in_progress' | 'finished'
  category TEXT NOT NULL DEFAULT 'ro_dero', -- 'ro_dero' | 'play_off'
  scheduled_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS news (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  excerpt TEXT,
  body TEXT,
  cover_image TEXT,
  category TEXT NOT NULL DEFAULT 'general', -- 'active_games' | 'popular' | 'newest' | 'tutorial'
  author_id INTEGER REFERENCES users(id),
  published_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Head-to-head (رو-در-رو) core: ticket/XP economy + manual submit/confirm/dispute workflow

CREATE TABLE IF NOT EXISTS grade_thresholds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  grade TEXT NOT NULL UNIQUE, -- 'D' | 'C' | 'B' | 'A'
  min_points INTEGER NOT NULL,
  max_points INTEGER -- NULL = no upper bound (top grade)
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  currency TEXT NOT NULL, -- 'ticket' | 'xp'
  amount INTEGER NOT NULL, -- positive = credit, negative = debit
  reason TEXT NOT NULL, -- 'match_stake' | 'match_refund' | 'match_reward' | 'admin_adjustment'
  reference_type TEXT,
  reference_id INTEGER,
  balance_after INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS h2h_matches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  creator_id INTEGER NOT NULL REFERENCES users(id),
  opponent_id INTEGER REFERENCES users(id),
  stake_type TEXT NOT NULL DEFAULT 'ticket', -- 'ticket' | 'xp' (xp = free entry mode)
  stake_amount INTEGER NOT NULL DEFAULT 1, -- 1..5 tickets when stake_type = 'ticket'
  console TEXT,
  game_version TEXT,
  is_private INTEGER NOT NULL DEFAULT 0,
  password_hash TEXT,
  admin_notes TEXT, -- توضیحات/قوانین که ادمین برای این بازی می‌نویسد
  status TEXT NOT NULL DEFAULT 'open',
  -- 'open' | 'locked' | 'completed' | 'cancelled'
  winner_id INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  locked_at TEXT,
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS h2h_legs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  match_id INTEGER NOT NULL REFERENCES h2h_matches(id) ON DELETE CASCADE,
  leg_number INTEGER NOT NULL, -- 1 | 2 (رفت / برگشت)
  home_user_id INTEGER NOT NULL REFERENCES users(id),
  away_user_id INTEGER NOT NULL REFERENCES users(id),
  submitted_by_id INTEGER REFERENCES users(id),
  submitted_home_score INTEGER,
  submitted_away_score INTEGER,
  status TEXT NOT NULL DEFAULT 'pending_submission',
  -- 'pending_submission' | 'pending_confirmation' | 'confirmed' | 'expert_review' | 'expert_resolved'
  confirmed_by_id INTEGER REFERENCES users(id),
  dispute_home_score INTEGER,
  dispute_away_score INTEGER,
  dispute_evidence TEXT, -- متن یا مسیر عکس مستندات
  dispute_by_id INTEGER REFERENCES users(id),
  expert_id INTEGER REFERENCES users(id),
  final_home_score INTEGER,
  final_away_score INTEGER,
  is_expert_reviewed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  resolved_at TEXT,
  UNIQUE(match_id, leg_number)
);

-- Admin-manageable dropdown options (console types, game versions) so the
-- site owner can add/remove/rename choices without a code deploy.
CREATE TABLE IF NOT EXISTS game_options (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL, -- 'console' | 'game_version'
  value TEXT NOT NULL,
  label TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(category, value)
);

CREATE TABLE IF NOT EXISTS season_archive (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  season_name TEXT NOT NULL,
  season_points INTEGER NOT NULL,
  grade TEXT NOT NULL,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  draws INTEGER NOT NULL DEFAULT 0,
  archived_at TEXT NOT NULL DEFAULT (datetime('now'))
);
