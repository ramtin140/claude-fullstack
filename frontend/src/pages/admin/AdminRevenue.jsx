import { useEffect, useState } from 'react';
import { Coins, TrendingUp, Swords } from 'lucide-react';
import { api } from '../../api/client.js';
import { formatDateTime } from '../../utils/datetime.js';
import { Card } from '../../components/ui/card.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Input } from '../../components/ui/input.jsx';
import { Badge } from '../../components/ui/badge.jsx';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table.jsx';

function Kpi({ icon: Icon, value, label }) {
  return (
    <Card className="p-5 text-center">
      <Icon className="mx-auto mb-1.5 text-gold" size={20} />
      <div className="text-[1.7rem] font-extrabold tabular-nums text-gold">{value}</div>
      <div className="mt-1 text-sm text-ink-muted">{label}</div>
    </Card>
  );
}

export default function AdminRevenue() {
  const [data, setData] = useState(null);
  const [feePercent, setFeePercent] = useState(30);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  function load() {
    api.get('/admin/revenue').then(({ data }) => {
      setData(data);
      setFeePercent(data.fee_percent);
    });
  }

  useEffect(load, []);

  async function saveFeePercent() {
    setError(null);
    setMessage(null);
    try {
      await api.put('/admin/h2h-fee-percent', { fee_percent: Number(feePercent) });
      setMessage('درصد کارمزد ذخیره شد.');
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'خطا در ذخیره کارمزد');
    }
  }

  if (!data) return <div className="flex justify-center py-16 text-ink-faint">در حال بارگذاری...</div>;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gold">درآمد و بازی‌ها</h1>
      </div>

      <div className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-[18px]">
        <Kpi icon={Coins} value={data.total_revenue.toLocaleString('fa-IR')} label="مجموع کارمزد (تیکت)" />
        <Kpi icon={TrendingUp} value={data.total_pot.toLocaleString('fa-IR')} label="مجموع مبلغ در گردش (تیکت)" />
        <Kpi icon={Swords} value={data.decided_matches.toLocaleString('fa-IR')} label="مسابقات دارای برنده" />
      </div>

      <Card className="mb-6 flex flex-wrap items-center gap-2.5 p-5">
        <span className="text-ink-muted">کارمزد سایت از هر مسابقه (٪ از مجموع مبلغ دو طرف، معادل نیمی از این عدد از هر بازیکن):</span>
        <Input
          type="number"
          min={0}
          max={100}
          step="0.1"
          value={feePercent}
          onChange={(e) => setFeePercent(e.target.value)}
          className="w-[100px] rounded-md"
        />
        <Button onClick={saveFeePercent}>ذخیره</Button>
      </Card>
      {message && <p className="mb-4 text-sm text-success">{message}</p>}
      {error && <p className="mb-4 text-sm text-critical">{error}</p>}

      {data.matches.length === 0 ? (
        <div className="rounded-md border border-dashed border-border py-16 text-center text-sm text-ink-faint">هنوز مسابقه‌ای با برنده ثبت نشده است.</div>
      ) : (
        <Card className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>بازیکنان</TableHead>
                <TableHead>برنده</TableHead>
                <TableHead>استیک هر نفر</TableHead>
                <TableHead>کارمزد سایت</TableHead>
                <TableHead>تاریخ پایان</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.matches.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    {m.creator_name} vs {m.opponent_name || '؟'}
                  </TableCell>
                  <TableCell className="text-gold">{m.winner_name}</TableCell>
                  <TableCell>{m.stake_amount}</TableCell>
                  <TableCell>
                    {m.platform_fee_amount === null ? <Badge variant="finished">بدون کارمزد (قدیمی)</Badge> : `${m.platform_fee_amount} تیکت`}
                  </TableCell>
                  <TableCell>{formatDateTime(m.completed_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
