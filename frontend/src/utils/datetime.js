// SQLite's datetime('now') stores UTC as "YYYY-MM-DD HH:MM:SS" with no zone
// suffix — Date can't parse that reliably across browsers without this.
export function parseUtc(sqliteDatetime) {
  if (!sqliteDatetime) return null;
  return new Date(sqliteDatetime.replace(' ', 'T') + 'Z');
}

export function formatDateTime(sqliteDatetime) {
  const d = parseUtc(sqliteDatetime);
  if (!d) return '';
  return d.toLocaleString('fa-IR', { dateStyle: 'short', timeStyle: 'short' });
}

export function formatTime(sqliteDatetime) {
  const d = parseUtc(sqliteDatetime);
  if (!d) return '';
  return d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
}

export function timeAgo(sqliteDatetime) {
  const ts = parseUtc(sqliteDatetime)?.getTime();
  if (!ts) return '';
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 60) return 'همین الان';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} دقیقه پیش`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ساعت پیش`;
  return `${Math.floor(hours / 24)} روز پیش`;
}
