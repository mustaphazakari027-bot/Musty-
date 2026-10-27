'use client';

import { useRef, useState } from 'react';

/**
 * Uploads through our own server endpoint, which signs the request with the
 * Cloudinary secret. The secret never reaches this component.
 */
export function ImageUploader({ onUploaded }: { onUploaded: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<'idle' | 'busy' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function upload(file: File) {
    setStatus('busy');
    setMessage('');
    const body = new FormData();
    body.append('file', file);
    try {
      const res = await fetch('/api/admin/upload', { method: 'POST', body });
      const json = (await res.json()) as { ok: boolean; url?: string; message?: string };
      if (!json.ok || !json.url) throw new Error(json.message || 'Upload failed.');
      onUploaded(json.url);
      setStatus('idle');
      setMessage('Image added.');
      if (inputRef.current) inputRef.current.value = '';
    } catch (error) {
      setStatus('error');
      setMessage((error as Error).message);
    }
  }

  return (
    <div className="rounded-2xl border border-dashed border-line bg-mint-50 p-3">
      <label className="block text-[11.5px] font-semibold text-ink">
        Upload product image
        <span className="ml-1 font-normal text-ink/45">(Cloudinary signed upload)</span>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/avif"
          className="mt-2 block w-full cursor-pointer text-[11px] text-ink/60 file:mr-2 file:rounded-full file:border-0 file:bg-forest file:px-3 file:py-1.5 file:text-[11px] file:font-semibold file:text-white"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
          }}
          disabled={status === 'busy'}
        />
      </label>
      {status === 'busy' && <p className="mt-2 text-[11px] text-emerald">Uploading…</p>}
      {status === 'error' && <p className="mt-2 text-[11px] text-red-600">{message}</p>}
      {status === 'idle' && message && <p className="mt-2 text-[11px] text-emerald">{message}</p>}
    </div>
  );
}
