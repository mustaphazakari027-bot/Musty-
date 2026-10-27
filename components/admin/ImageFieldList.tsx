'use client';

import { useState } from 'react';
import { ImageUploader } from '@/components/admin/ImageUploader';

/** Newline-separated image URLs, kept in state so uploads can append to them. */
export function ImageFieldList({ initial }: { initial: string[] }) {
  const [value, setValue] = useState(initial.join('\n'));
  const urls = value
    .split('\n')
    .map((v) => v.trim())
    .filter(Boolean);

  return (
    <div>
      <label htmlFor="images" className="label">
        Product images
      </label>
      <textarea
        id="images"
        name="images"
        rows={4}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="field font-mono text-[11.5px]"
        placeholder={'/images/products/my-shoe.webp\nhttps://res.cloudinary.com/.../shoe.jpg'}
      />
      <p className="hint">One URL per line. The first image is the main product photo.</p>

      <div className="mt-2.5">
        <ImageUploader onUploaded={(url) => setValue((v) => (v.trim() ? `${v.trim()}\n${url}` : url))} />
      </div>

      {urls.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-2">
          {urls.map((url) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={url}
              src={url}
              alt=""
              className="h-16 w-16 rounded-xl border border-line bg-white object-cover"
            />
          ))}
        </div>
      )}
    </div>
  );
}
