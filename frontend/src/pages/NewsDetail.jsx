import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client.js';
import '../styles/pages.css';

export default function NewsDetail() {
  const { id } = useParams();
  const [news, setNews] = useState(null);

  useEffect(() => {
    api.get(`/news/${id}`).then(({ data }) => setNews(data.news));
  }, [id]);

  if (!news) return <div className="empty-state" style={{ padding: 60 }}>در حال بارگذاری...</div>;

  return (
    <div className="page-wrap">
      <div className="detail-hero">
        <div className="container">
          <h1>{news.title}</h1>
        </div>
      </div>
      <div className="container detail-body">
        <div className="about-content">
          <p>{news.body}</p>
          <Link to="/news" className="btn btn-outline">
            بازگشت به اخبار
          </Link>
        </div>
      </div>
    </div>
  );
}
