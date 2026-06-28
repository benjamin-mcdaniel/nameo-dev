import { batchProcessShorts, batchProcessBrandable } from './lib/batchProcessor.js';

const BATCH_SIZE = 30;
const ALARM_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes between batches

export class NameCollector {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    const { pathname } = new URL(request.url);

    if (pathname === '/status') return Response.json(await this.getStatus());
    if (pathname === '/run') {
      this.state.waitUntil(this.runBatch());
      return Response.json({ ok: true, message: 'batch started' });
    }
    if (pathname === '/reset') {
      await this.state.storage.deleteAll();
      return Response.json({ ok: true, message: 'state cleared' });
    }

    return Response.json({ error: 'unknown action' }, { status: 404 });
  }

  async alarm() {
    await this.runBatch();
    await this.scheduleNext();
  }

  async runBatch() {
    const mode = (await this.state.storage.get('mode')) ?? 'brandable';
    const cursor = (await this.state.storage.get('cursor')) ?? 0;
    const wordlistCursor = (await this.state.storage.get('wordlist_cursor')) ?? 0;

    try {
      if (mode === 'shorts') {
        const indexed = await batchProcessShorts(this.env.DB, BATCH_SIZE);
        await this.state.storage.put('cursor', cursor + indexed);
        await this.state.storage.put('mode', 'brandable');
      } else {
        const { processed, nextCursor, done } = await batchProcessBrandable(
          this.env.DB, wordlistCursor, BATCH_SIZE
        );
        await this.state.storage.put('cursor', cursor + processed);

        if (done) {
          await this.state.storage.put('wordlist_cursor', 0);
          await this.state.storage.put('last_full_pass', Date.now());
        } else {
          await this.state.storage.put('wordlist_cursor', nextCursor);
        }
        await this.state.storage.put('mode', 'shorts');
      }

      await this.state.storage.put('last_run', Date.now());
      await this.state.storage.delete('last_error');
    } catch (err) {
      await this.state.storage.put('last_error', err.message);
    }
  }

  async scheduleNext() {
    await this.state.storage.setAlarm(Date.now() + ALARM_INTERVAL_MS);
  }

  async getStatus() {
    const keys = ['mode', 'cursor', 'wordlist_cursor', 'last_run', 'last_error', 'last_full_pass'];
    const map = await this.state.storage.get(keys);
    return Object.fromEntries(keys.map(k => [k, map.get ? map.get(k) : map[k]]));
  }
}

// Worker entry: routes requests to the single global DO instance
export default {
  async fetch(request, env) {
    const id = env.COLLECTOR.idFromName('global');
    return env.COLLECTOR.get(id).fetch(request);
  },

  async scheduled(_event, env, ctx) {
    const id = env.COLLECTOR.idFromName('global');
    ctx.waitUntil(env.COLLECTOR.get(id).fetch(new Request('https://internal/run')));
  },
};
