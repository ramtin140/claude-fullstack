import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div style={{ textAlign: 'center', padding: '100px 20px' }}>
      <h1 style={{ color: 'var(--gold)', fontSize: '3rem' }}>۴۰۴</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>صفحه مورد نظر یافت نشد.</p>
      <Link to="/" className="btn btn-primary">
        بازگشت به خانه
      </Link>
    </div>
  );
}
