import { db } from '../db/index.js';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function insertMatch({ tournamentId, round, slot, homeId, awayId, isBye = false }) {
  const winnerId = isBye ? homeId ?? awayId : null;
  const info = db
    .prepare(
      `INSERT INTO matches (tournament_id, home_user_id, away_user_id, home_name, away_name, status, category, round, bracket_slot, is_bye, winner_id)
       VALUES (?, ?, ?, NULL, NULL, ?, 'ro_dero', ?, ?, ?, ?)`
    )
    .run(
      tournamentId,
      homeId || null,
      awayId || null,
      isBye ? 'finished' : 'waiting',
      round,
      slot,
      isBye ? 1 : 0,
      winnerId
    );
  return info.lastInsertRowid;
}

function linkToNext(matchId, nextMatchId, nextSlot) {
  db.prepare('UPDATE matches SET next_match_id = ?, next_match_slot = ? WHERE id = ?').run(
    nextMatchId,
    nextSlot,
    matchId
  );
}

// Builds a single-elimination bracket. `participantIds` must already be in
// its final round-1 order (a power-of-two length) — the caller is
// responsible for shuffling. This does NOT reshuffle: playoff callers
// deliberately position bye (null) slots after shuffling real players, and
// reshuffling here would scramble those positions, occasionally producing
// two byes paired against each other with no real player in the match at all.
function buildSingleElimination(tournamentId, participantIds) {
  const totalRounds = Math.log2(participantIds.length);

  // Round 1 matches, pairing participants two at a time. A `null` opponent
  // (playoff padding) produces a bye: the present player is auto-advanced
  // with no match to play.
  let currentRoundMatchIds = [];
  for (let i = 0; i < participantIds.length; i += 2) {
    const home = participantIds[i] ?? null;
    const away = participantIds[i + 1] ?? null;
    // The bye slot (null) can land on either side of a pair depending on
    // where the shuffle put it — check both, not just "away".
    const isBye = home == null || away == null;
    const id = insertMatch({ tournamentId, round: 1, slot: i / 2, homeId: home, awayId: away, isBye });
    currentRoundMatchIds.push(id);
  }

  // Empty placeholder matches for every subsequent round, wired up so a
  // finished match's winner automatically slots into the next round.
  for (let round = 2; round <= totalRounds; round++) {
    const nextRoundMatchIds = [];
    for (let i = 0; i < currentRoundMatchIds.length; i += 2) {
      const nextId = insertMatch({ tournamentId, round, slot: i / 2, homeId: null, awayId: null });
      linkToNext(currentRoundMatchIds[i], nextId, 'home');
      linkToNext(currentRoundMatchIds[i + 1], nextId, 'away');
      nextRoundMatchIds.push(nextId);
    }
    currentRoundMatchIds = nextRoundMatchIds;
  }

  // Byes in round 1 have no next round to propagate to yet if totalRounds
  // was just computed — advance them now that the links exist.
  for (const id of db.prepare('SELECT id FROM matches WHERE tournament_id = ? AND round = 1 AND is_bye = 1').all(tournamentId)) {
    advanceWinner(id.id);
  }
}

export function generateCupBracket(tournamentId, participantIds) {
  buildSingleElimination(tournamentId, shuffle(participantIds));
}

// Playoff: any participant count works. Pad up to the next power of two with
// byes, randomly deciding who gets one — "یه سری بازیکن به صورت رندوم به
// مرحله بعد میرن و به استراحت میخورن".
export function generatePlayoffBracket(tournamentId, participantIds) {
  const nextPow2 = 2 ** Math.ceil(Math.log2(participantIds.length));
  const byeCount = nextPow2 - participantIds.length;
  const withByes = shuffle(participantIds);
  for (let i = 0; i < byeCount; i++) {
    withByes.splice(i * 2 + 1, 0, null);
  }
  buildSingleElimination(tournamentId, withByes);
}

// Single round-robin via the standard "circle method": one player is fixed,
// the rest rotate each round so everyone plays everyone exactly once.
export function generateLeagueSchedule(tournamentId, participantIds) {
  const players = [...participantIds];
  if (players.length % 2 !== 0) players.push(null); // bye slot for odd counts

  const n = players.length;
  const rounds = n - 1;
  let arr = [...players];

  for (let round = 0; round < rounds; round++) {
    for (let i = 0; i < n / 2; i++) {
      const home = arr[i];
      const away = arr[n - 1 - i];
      if (home != null && away != null) {
        insertMatch({ tournamentId, round: round + 1, slot: i, homeId: home, awayId: away });
      }
    }
    // Rotate all but the first element.
    arr = [arr[0], ...arr.slice(2), arr[1]];
  }
}

// Called whenever a bracket match's score is finalized (status set to
// 'finished' with both scores present). Determines the winner, caches it on
// the match, and pushes it into the linked next-round slot, if any.
export function advanceWinner(matchId) {
  const match = db.prepare('SELECT * FROM matches WHERE id = ?').get(matchId);
  if (!match) return;

  let winnerId = match.winner_id;
  if (!winnerId && match.home_score != null && match.away_score != null) {
    if (match.home_score > match.away_score) winnerId = match.home_user_id;
    else if (match.away_score > match.home_score) winnerId = match.away_user_id;
    // A drawn knockout match has no winner to advance; the spec's final is
    // single-leg with no replay rule specified, so this is left for an
    // admin to resolve manually (e.g. correcting a score) rather than guessed.
    if (winnerId) db.prepare('UPDATE matches SET winner_id = ? WHERE id = ?').run(winnerId, matchId);
  }

  if (winnerId && match.next_match_id) {
    const column = match.next_match_slot === 'home' ? 'home_user_id' : 'away_user_id';
    db.prepare(`UPDATE matches SET ${column} = ? WHERE id = ?`).run(winnerId, match.next_match_id);
  }
}

export function computeStandings(tournamentId) {
  const matches = db
    .prepare("SELECT * FROM matches WHERE tournament_id = ? AND status = 'finished' AND home_score IS NOT NULL AND away_score IS NOT NULL")
    .all(tournamentId);

  const table = new Map();
  function ensure(userId) {
    if (!table.has(userId)) {
      table.set(userId, { user_id: userId, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 });
    }
    return table.get(userId);
  }

  for (const m of matches) {
    if (!m.home_user_id || !m.away_user_id) continue;
    const home = ensure(m.home_user_id);
    const away = ensure(m.away_user_id);
    home.played++;
    away.played++;
    home.gf += m.home_score;
    home.ga += m.away_score;
    away.gf += m.away_score;
    away.ga += m.home_score;

    if (m.home_score > m.away_score) {
      home.won++;
      home.points += 3;
      away.lost++;
    } else if (m.away_score > m.home_score) {
      away.won++;
      away.points += 3;
      home.lost++;
    } else {
      home.drawn++;
      away.drawn++;
      home.points += 1;
      away.points += 1;
    }
  }

  const rows = [...table.values()].map((r) => ({ ...r, gd: r.gf - r.ga }));
  rows.sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf);
  return rows;
}
