import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/home.css';

const slides = [
  {
    tag: 'برگزاری مسابقات آنلاین',
    title: 'FIFA SOUL چیست؟',
    text: 'خانه دیجیتال فوتبال؛ جایی برای ثبت‌نام در تورنمنت‌ها، رقابت با بهترین گیمرها و کسب جوایز نقدی و ارزنده.',
  },
  {
    tag: 'شروع مسابقات فصل جدید',
    title: 'در لیگ ستارگان بدرخش',
    text: 'با ثبت‌نام در لیگ‌ها و کاپ‌های فعال، مسیر قهرمانی خودت را شروع کن و رتبه‌ات را در جدول امتیازات بالا ببر.',
  },
  {
    tag: 'جوایز نفیس و ارزنده',
    title: 'رقابت کن، ببر، بدرخش',
    text: 'هر هفته مسابقات جدید با جوایز نقدی برگزار می‌شود. همین حالا عضو شو و اولین مسابقه‌ات را رزرو کن.',
  },
];

export default function HeroSlider() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, []);

  const slide = slides[index];

  return (
    <section className="hero">
      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <span className="hero-tag">{slide.tag}</span>
        <h1>{slide.title}</h1>
        <p>{slide.text}</p>
        <div className="hero-actions">
          <Link to="/register" className="btn btn-primary">
            ثبت‌نام کنید
          </Link>
          <Link to="/tournaments" className="btn btn-outline">
            بیشتر بدانید
          </Link>
        </div>
        <div className="hero-dots">
          {slides.map((_, i) => (
            <button
              key={i}
              className={i === index ? 'active' : ''}
              onClick={() => setIndex(i)}
              aria-label={`اسلاید ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
