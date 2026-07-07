import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

// Roles per spec: مدیر ارشد (senior_admin) has full access; نویسنده (writer)
// manages content (news/tutorials/FAQ); کارشناس مسابقات و نتایج (match_expert)
// only handles the h2h dispute/expert-review queue. senior_admin implicitly
// has every lesser role's access too.
export const ROLES = ['member', 'writer', 'match_expert', 'senior_admin'];

export function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'توکن احراز هویت ارسال نشده است.' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'توکن نامعتبر یا منقضی شده است.' });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (req.user?.role === 'senior_admin' || roles.includes(req.user?.role)) {
      return next();
    }
    return res.status(403).json({ error: 'دسترسی شما برای این عملیات کافی نیست.' });
  };
}

// Full access — user management, financial/wallet operations, tournament
// and game-option management.
export const requireAdmin = requireRole('senior_admin');

// News / tutorials / FAQ content management.
export const requireContentManager = requireRole('senior_admin', 'writer');

// h2h dispute/expert-review queue.
export const requireMatchExpert = requireRole('senior_admin', 'match_expert');
