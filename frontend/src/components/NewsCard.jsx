import { Link } from 'react-router-dom';
import { Newspaper } from 'lucide-react';
import '../styles/home.css';

export default function NewsCard({ item }) {
  return (
    <article className="card news-card">
      <div className="news-card-media">
        <Newspaper size={32} />
      </div>
      <div className="news-card-body">
        <h3>{item.title}</h3>
        <p>{item.excerpt}</p>
        <Link to={`/news/${item.id}`}>ادامه مطلب ‹</Link>
      </div>
    </article>
  );
}
