import { getUser } from './middleware/auth.js';
import { handleSearch } from './routes/search.js';
import { handleHistory } from './routes/history.js';
import { handleName } from './routes/name.js';
import { handleRefresh } from './routes/refresh.js';
import { handleMcp } from './routes/mcp.js';
import { json, cors } from './lib/json.js';

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return cors(new Response(null, { status: 204 }));
    }

    const { pathname } = new URL(request.url);

    if (pathname === '/api/health' && request.method === 'GET') {
      return json({ status: 'ok' });
    }

    if (pathname === '/mcp' && request.method === 'POST') {
      return handleMcp(request, env, ctx);
    }

    const user = await getUser(request, env);
    if (!user) return json({ error: 'Unauthorized' }, 401);

    if (pathname === '/api/search' && request.method === 'POST') {
      return handleSearch(request, env, ctx, user);
    }
    if (pathname === '/api/history' && request.method === 'GET') {
      return handleHistory(request, env, user);
    }
    if (pathname.startsWith('/api/name/') && request.method === 'GET') {
      return handleName(request, env, user, pathname.slice('/api/name/'.length));
    }
    if (pathname.startsWith('/api/refresh/') && request.method === 'POST') {
      return handleRefresh(request, env, ctx, user, pathname.slice('/api/refresh/'.length));
    }
    if (pathname === '/api/stripe/webhook' && request.method === 'POST') {
      return handleStripeWebhook(request, env);
    }

    return json({ error: 'Not found' }, 404);
  },
};

async function handleStripeWebhook(request, env) {
  // Verify Stripe signature and update user tier
  // Full implementation requires STRIPE_WEBHOOK_SECRET
  const sig = request.headers.get('stripe-signature');
  if (!sig) return json({ error: 'Missing signature' }, 400);

  try {
    const body = await request.text();
    // TODO: verify signature with STRIPE_WEBHOOK_SECRET using subtle crypto
    const event = JSON.parse(body);

    if (event.type === 'checkout.session.completed') {
      const { client_reference_id: userId, customer } = event.data.object;
      if (userId) {
        const { setUserTier } = await import('./lib/db.js');
        await setUserTier(env.DB, userId, 'paid', customer);
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const { metadata } = event.data.object;
      if (metadata?.clerk_user_id) {
        const { setUserTier } = await import('./lib/db.js');
        await setUserTier(env.DB, metadata.clerk_user_id, 'free');
      }
    }

    return json({ received: true });
  } catch (err) {
    return json({ error: err.message }, 400);
  }
}
