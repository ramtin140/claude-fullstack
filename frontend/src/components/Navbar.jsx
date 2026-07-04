import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import '../styles/layout.css';

const links = [
  { to: '/', label: 'خانه' },
  { to: '/tournaments', label: 'مسابقات' },
  { to: '/news', label: 'اخبار' },
  { to: '/about', label: 'درباره ما' },
  { to: '/contact', label: 'تماس با ما' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand">
          <span className="brand-badge">S</span>
          FIFA SOUL
        </Link>

        <nav className={`nav-links ${open ? 'open' : ''}`} onClick={() => setOpen(false)}>
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === '/'}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="nav-actions">
          {user ? (
            <>
              <Link
                to={user.role === 'admin' ? '/admin' : '/dashboard'}
                className="user-chip"
                title={user.name}
              >
                {user.role === 'admin' ? <ShieldCheck size={16} /> : <User size={16} />}
                {user.name}
              </Link>
              <button
                className="btn btn-outline"
                onClick={() => {
                  logout();
                  navigate('/');
                }}
              >
                <LogOut size={16} />
                خروج
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline">
                ورود
              </Link>
              <Link to="/register" className="btn btn-primary">
                ثبت‌نام
              </Link>
            </>
          )}
          <button className="nav-toggle" onClick={() => setOpen((o) => !o)} aria-label="منو">
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
    </header>
  );
}
