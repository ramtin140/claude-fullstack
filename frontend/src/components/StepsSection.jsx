import { UserPlus, Wallet, Swords, Trophy, Award } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const steps = [
  { icon: UserPlus, label: 'ثبت‌نام رایگان' },
  { icon: Wallet, label: 'تکمیل پروفایل و شارژ کیف پول' },
  { icon: Swords, label: 'ایجاد یا پیوستن به مسابقه' },
  { icon: Trophy, label: 'رقابت آنلاین و ثبت نتیجه' },
  { icon: Award, label: 'کسب امتیاز و جایزه نقدی' },
];

// Pure top-of-funnel onboarding — once someone's actually a member this
// content has nothing left to tell them, so it only shows to guests.
export default function StepsSection() {
  const { user } = useAuth();
  if (user) return null;

  return (
    <section className="bg-gradient-to-l from-gold-light to-gold py-9 text-[#241102]">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-6 px-4 md:flex-row md:justify-between md:px-6">
        <h2 className="shrink-0 text-lg font-bold">مراحل شروع به کار</h2>
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-5 md:justify-end">
          {steps.map(({ icon: Icon, label }, i) => (
            <div key={label} className="flex items-center gap-2.5">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-[#241102]/25 bg-[#241102]/10">
                <Icon size={20} />
              </span>
              <span className="max-w-[110px] text-sm font-semibold leading-snug">{label}</span>
              {i < steps.length - 1 && <span className="hidden h-px w-6 bg-[#241102]/25 md:block" aria-hidden="true" />}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
