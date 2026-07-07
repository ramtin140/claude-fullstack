import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// senior_admin implicitly has access to everything a writer/match_expert can
// reach, matching the backend's requireRole() behavior.
export function hasStaffAccess(user, roles) {
  if (!user) return false;
  if (user.role === 'senior_admin') return true;
  return roles.includes(user.role);
}

export function isStaff(user) {
  return Boolean(user) && user.role !== 'member';
}

export const ROLE_LABELS = {
  member: 'عضو',
  writer: 'نویسنده',
  match_expert: 'کارشناس مسابقات',
  senior_admin: 'مدیر ارشد',
};

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (roles && !hasStaffAccess(user, roles)) return <Navigate to="/" replace />;

  return children;
}
