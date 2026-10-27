import Link from 'next/link';
import { CheckIcon, CloseIcon } from '@/components/Icons';

/**
 * Server-rendered flash message. Pages read `?flash=` from searchParams and pass
 * it here, so feedback survives a no-JavaScript form POST.
 */
export function Flash({
  message,
  tone = 'ok',
  clearHref,
}: {
  message?: string | string[] | null;
  tone?: string | string[] | null;
  clearHref: string;
}) {
  const text = Array.isArray(message) ? message[0] : message;
  if (!text) return null;
  const isError = (Array.isArray(tone) ? tone[0] : tone) === 'error';
  return (
    <div
      role="status"
      className={`mb-5 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${
        isError
          ? 'border-red-200 bg-red-50 text-red-700'
          : 'border-emerald/25 bg-emerald/8 text-forest'
      }`}
    >
      <span
        className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-white ${
          isError ? 'bg-red-500' : 'bg-emerald'
        }`}
      >
        {isError ? <CloseIcon size={12} /> : <CheckIcon size={12} />}
      </span>
      <p className="flex-1 font-medium">{text}</p>
      <Link href={clearHref} aria-label="Dismiss message" className="text-current/50 hover:text-current">
        <CloseIcon size={16} />
      </Link>
    </div>
  );
}
