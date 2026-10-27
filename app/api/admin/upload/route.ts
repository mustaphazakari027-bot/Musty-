import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { requireAdminSession, isStaff } from '@/lib/auth';
import { jsonError, jsonOk } from '@/lib/http';

const MAX_BYTES = 6 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

/**
 * Secure image upload endpoint.
 *  • Cloudinary: a signed upload is created on the server; the API secret never
 *    leaves the server and never appears in client JavaScript.
 *  • Local fallback (development only): writes into /public/uploads.
 */
export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (!session || !isStaff(session)) return jsonError('Not authorised.', 401);

  const form = await request.formData();
  const file = form.get('file');

  if (!(file instanceof File)) return jsonError('Choose an image to upload.');
  if (!ALLOWED.includes(file.type)) return jsonError('Use a JPG, PNG, WebP or AVIF image.');
  if (file.size > MAX_BYTES) return jsonError('Images must be smaller than 6 MB.');

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const folder = process.env.CLOUDINARY_UPLOAD_FOLDER || 'zakson/products';

  if (cloudName && apiKey && apiSecret) {
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = crypto
      .createHash('sha1')
      .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
      .digest('hex');

    const body = new FormData();
    body.append('file', file);
    body.append('api_key', apiKey);
    body.append('timestamp', String(timestamp));
    body.append('folder', folder);
    body.append('signature', signature);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body,
    });
    const json = (await res.json()) as { secure_url?: string; error?: { message: string } };
    if (!res.ok || !json.secure_url) {
      return jsonError(json.error?.message || 'Cloudinary upload failed.', 502);
    }
    return jsonOk({ url: json.secure_url });
  }

  if (process.env.NODE_ENV === 'production') {
    return jsonError(
      'Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET, or paste image URLs instead.',
      501,
    );
  }

  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const name = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
  const dir = path.join(process.cwd(), 'public', 'uploads');
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return jsonOk({ url: `/uploads/${name}`, note: 'Stored locally (development only).' });
}
