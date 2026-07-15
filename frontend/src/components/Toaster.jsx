import { useEffect, useState } from 'react';
import Icon from './Icons.jsx';

const STYLES = {
  success: { wrap: 'border-emerald-100 dark:border-emerald-900 text-slate-800 dark:text-slate-100', icon: 'text-emerald-500', iconName: 'check-circle' },
  warning: { wrap: 'border-red-100 dark:border-red-900 text-slate-800 dark:text-slate-100', icon: 'text-red-500', iconName: 'trash-2' },
  error: { wrap: 'border-red-600 bg-red-500 text-white', icon: 'text-white', iconName: 'alert-triangle' },
  info: { wrap: 'border-blue-100 dark:border-blue-900 text-slate-800 dark:text-slate-100', icon: 'text-blue-500', iconName: 'info' },
};

function ToastItem({ toast, onDone }) {
  const [show, setShow] = useState(false);
  const style = STYLES[toast.type] || STYLES.success;

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 10);
    const hide = setTimeout(() => setShow(false), 3000);
    const done = setTimeout(() => onDone(toast.id), 3350);
    return () => {
      clearTimeout(t);
      clearTimeout(hide);
      clearTimeout(done);
    };
  }, [toast.id, onDone]);

  return (
    <div
      className={`pointer-events-auto flex items-center gap-3 rounded-2xl border p-4 text-sm shadow-xl transition-all duration-300 ${style.wrap} ${
        show ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
      }`}
    >
      <span className={style.icon}>
        <Icon name={style.iconName} className="h-5 w-5" />
      </span>
      <p className="font-bold tracking-tight">{toast.message}</p>
    </div>
  );
}

export default function Toaster({ toasts, onDismiss }) {
  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex w-full max-w-sm flex-col gap-2">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDone={onDismiss} />
      ))}
    </div>
  );
}
