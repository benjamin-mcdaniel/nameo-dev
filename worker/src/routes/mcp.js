import { getUser } from '../middleware/auth.js';
import { handleSearch } from './search.js';
import { handleHistory } from './history.js';
import { handleName } from './name.js';
import { handleRefresh } from './refresh.js';
import { json } from '../lib/json.js';

const TOOLS = [
  {
    name: 'search_names',
    description: 'Search the index for available names. Results are saved to your account history and count against your daily limit.',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          enum: ['short', 'brandable'],
          description: '"short": randomly-generated pronounceable names ≤6 chars. "brandable": real English words and blends. Free tier: short only.',
        },
      },
      required: ['category'],
    },
  },
  {
    name: 'get_name_profile',
    description: 'Get the full availability profile for a specific name — all TLD statuses and social handle data. Paid tier receives complete data; free tier receives name and TLDs only.',
    inputSchema: {
      type: 'object',
      properties: {
        word: { type: 'string', description: 'Base name to look up (no TLD, lowercase)' },
      },
      required: ['word'],
    },
  },
  {
    name: 'get_history',
    description: 'Retrieve your saved search history (snapshots, not live data). Most recent first.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Number of history entries to return (default 20, max 100)', default: 20 },
      },
    },
  },
  {
    name: 'refresh_result',
    description: 'Re-check domain availability for a saved search result. Costs 1 daily search unit.',
    inputSchema: {
      type: 'object',
      properties: {
        result_id: { type: 'string', description: 'ID of the saved result to refresh (from search_names or get_history)' },
      },
      required: ['result_id'],
    },
  },
];

export async function handleMcp(request, env, ctx) {
  const user = await getUser(request, env);
  if (!user) return mcpError(null, -32001, 'Unauthorized');

  let msg;
  try {
    msg = await request.json();
  } catch {
    return mcpError(null, -32700, 'Parse error');
  }

  const { method, params, id } = msg;

  switch (method) {
    case 'initialize':
      return mcpOk(id, {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'nameo', version: '3.0.0' },
      });

    case 'notifications/initialized':
      return new Response(null, { status: 204 });

    case 'ping':
      return mcpOk(id, {});

    case 'tools/list':
      return mcpOk(id, { tools: TOOLS });

    case 'tools/call':
      return handleToolCall(params, id, request, env, ctx, user);

    default:
      return mcpError(id, -32601, 'Method not found');
  }
}

async function handleToolCall(params, id, request, env, ctx, user) {
  const { name, arguments: args = {} } = params ?? {};

  try {
    let result;

    if (name === 'search_names') {
      const synth = new Request(request.url, {
        method: 'POST',
        headers: request.headers,
        body: JSON.stringify({ category: args.category }),
      });
      const res = await handleSearch(synth, env, ctx, user);
      result = await res.json();
    } else if (name === 'get_name_profile') {
      const res = await handleName(request, env, user, args.word ?? '');
      result = await res.json();
    } else if (name === 'get_history') {
      const url = new URL(request.url);
      url.searchParams.set('limit', String(args.limit ?? 20));
      const synth = new Request(url, { headers: request.headers });
      const res = await handleHistory(synth, env, user);
      result = await res.json();
    } else if (name === 'refresh_result') {
      const res = await handleRefresh(request, env, ctx, user, args.result_id ?? '');
      result = await res.json();
    } else {
      return mcpError(id, -32602, `Unknown tool: ${name}`);
    }

    return mcpOk(id, {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    });
  } catch (err) {
    return mcpError(id, -32603, err.message);
  }
}

function mcpOk(id, result) {
  return json({ jsonrpc: '2.0', id, result });
}

function mcpError(id, code, message) {
  return json({ jsonrpc: '2.0', id, error: { code, message } });
}

function json(data) {
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  });
}
