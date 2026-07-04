import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import NewsCard from '../components/NewsCard.jsx';
import '../styles/layout.css';

export default function News() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/news').then(({ data }) => setNews(data.news)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-wrap">
      <div className="page-header">
        <h1>اخبار و مقالات</h1>
        <p>آخرین اخبار مسابقات، آموزش‌ها و مطالب گیمینگ</p>
      </div>
      <div className="container" style={{ paddingBottom: 60 }}>
        {loading ? (
          <div className="empty-state">در حال بارگذاری...</div>
        ) : (
          <div className="news-grid">
            {news.map((n) => (
              <NewsCard key={n.id} item={n} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
