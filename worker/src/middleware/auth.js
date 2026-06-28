import { verifyToken } from '@clerk/backend';
import { getUserTier } from '../lib/db.js';

export async function getUser(request, env) {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;

  try {
    const payload = await verifyToken(auth.slice(7), {
      secretKey: env.CLERK_SECRET_KEY,
    });
    const tier = await getUserTier(env.DB, payload.sub);
    return { userId: payload.sub, tier };
  } catch {
    return null;
  }
}
