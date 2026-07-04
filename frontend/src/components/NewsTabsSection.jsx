import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import NewsCard from './NewsCard.jsx';
import '../styles/home.css';

const tabs = [
  { key: 'active_games', label: 'بازی‌های فعال' },
  { key: 'newest', label: 'جدیدترین‌ها' },
  { key: 'popular', label: 'گیک‌ها' },
  { key: 'tutorial', label: 'آموزش‌ها' },
];

export default function NewsTabsSection() {
  const [active, setActive] = useState(tabs[0].key);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get('/news', { params: { category: active } })
      .then(({ data }) => setNews(data.news))
      .finally(() => setLoading(false));
  }, [active]);

  return (
    <section className="section">
      <div className="container">
        <h2 className="section-title">اخبار و مطالب</h2>
        <div className="tabs">
          {tabs.map((t) => (
            <button
              key={t.key}
              className={`tab-btn ${active === t.key ? 'active' : ''}`}
              onClick={() => setActive(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="empty-state">در حال بارگذاری...</div>
        ) : news.length === 0 ? (
          <div className="empty-state">مطلبی در این دسته ثبت نشده است.</div>
        ) : (
          <div className="news-grid">
            {news.map((n) => (
              <NewsCard key={n.id} item={n} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
