import { destroySession } from '@/lib/auth';
import { redirectTo, withFlash } from '@/lib/redirect';

export async function POST(request: Request) {
  await destroySession();
  return redirectTo(request, withFlash('/', 'You have been signed out.'));
}
