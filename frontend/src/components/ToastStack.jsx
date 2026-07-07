import { useRealtime } from '../context/RealtimeContext.jsx';
import '../styles/toast.css';

export default function ToastStack() {
  const realtime = useRealtime();
  if (!realtime || realtime.toasts.length === 0) return null;

  return (
    <div className="toast-stack">
      {realtime.toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.tone}`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}
