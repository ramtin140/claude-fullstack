import { db } from '../db/index.js';

// win = 35, draw = 20, loss = 0 season points, per spec.
export const RESULT_POINTS = { win: 35, draw: 20, loss: 0 };

export function computeGrade(seasonPoints) {
  const thresholds = db.prepare('SELECT * FROM grade_thresholds ORDER BY min_points DESC').all();
  for (const t of thresholds) {
    if (seasonPoints >= t.min_points && (t.max_points == null || seasonPoints <= t.max_points)) {
      return t.grade;
    }
  }
  return thresholds.at(-1)?.grade ?? 'D';
}

export function addSeasonPoints(userId, delta) {
  const user = db.prepare('SELECT season_points FROM users WHERE id = ?').get(userId);
  if (!user) throw new Error('کاربر یافت نشد.');

  const newPoints = Math.max(0, user.season_points + delta);
  const grade = computeGrade(newPoints);
  db.prepare('UPDATE users SET season_points = ?, grade = ? WHERE id = ?').run(newPoints, grade, userId);
  return { season_points: newPoints, grade };
}

// Admin action: archives every user's current season into season_archive,
// then resets season_points to 0 (grade recomputed to the base grade).
// Per spec this runs quarterly; there's no cron here, it's a manual admin
// endpoint (POST /api/admin/season/reset) since exact scheduling wasn't specified.
export function resetSeason(seasonName) {
  const users = db.prepare('SELECT id, season_points, grade, wins, losses, draws FROM users').all();
  const insertArchive = db.prepare(
    `INSERT INTO season_archive (user_id, season_name, season_points, grade, wins, losses, draws)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  const resetUser = db.prepare(
    `UPDATE users SET season_points = 0, grade = ?, wins = 0, losses = 0, draws = 0 WHERE id = ?`
  );
  const baseGrade = computeGrade(0);

  const tx = db.transaction(() => {
    for (const u of users) {
      insertArchive.run(u.id, seasonName, u.season_points, u.grade, u.wins, u.losses, u.draws);
      resetUser.run(baseGrade, u.id);
    }
  });
  tx();

  return { archived_users: users.length, season_name: seasonName };
}
