'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { postJson } from '@/lib/api-client';

/**
 * Bouton d'action admin : POST JSON puis rafraîchit la page serveur.
 * `confirmText` demande une confirmation pour les actions irréversibles.
 */
export default function ActionButton({
  url,
  body,
  label,
  pendingLabel,
  confirmText,
  variant = 'ghost',
}: {
  url: string;
  body: unknown;
  label: string;
  pendingLabel?: string;
  confirmText?: string;
  variant?: 'primary' | 'ghost' | 'dark';
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'error' | 'info'; text: string } | null>(null);

  async function run() {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(true);
    setMessage(null);
    const res = await postJson<{ message?: string }>(url, body);
    setBusy(false);
    if (!res.ok) {
      setMessage({ tone: 'error', text: res.error.message });
      return;
    }
    if (res.data && typeof res.data.message === 'string') {
      setMessage({ tone: 'info', text: res.data.message });
    }
    router.refresh();
  }

  return (
    <span className="inline-flex flex-col gap-1">
      <button
        type="button"
        className={`btn btn-${variant} px-3 py-2 text-xs`}
        onClick={run}
        disabled={busy}
      >
        {busy ? (pendingLabel ?? 'En cours…') : label}
      </button>
      {message && (
        <span
          role={message.tone === 'error' ? 'alert' : 'status'}
          className={`max-w-xs text-xs font-semibold ${message.tone === 'error' ? 'text-[#b8320d]' : ''}`}
        >
          {message.text}
        </span>
      )}
    </span>
  );
}
