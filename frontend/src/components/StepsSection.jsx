import '../styles/home.css';

const steps = [
  { n: 1, label: 'ثبت‌نام', current: true },
  { n: 2, label: 'تایید عضویت' },
  { n: 3, label: 'ایجاد یا شرکت در تیکت' },
  { n: 4, label: 'شروع مسابقات حضوری' },
  { n: 5, label: 'فینال مسابقات' },
];

export default function StepsSection() {
  return (
    <section className="steps-section">
      <div className="container steps-inner">
        <h2 style={{ margin: 0, fontSize: '1.2rem' }}>مراحل شروع به کار</h2>
        <div className="steps-list">
          {steps.map((s) => (
            <div key={s.n} className={`step-item ${s.current ? 'current' : ''}`}>
              <span className="step-circle">{s.n}</span>
              {s.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
