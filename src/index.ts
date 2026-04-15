interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
}

/**
 * URLhaus MCP — wraps abuse.ch URLhaus malware URL database (free, no auth)
 *
 * All endpoints use HTTP POST with application/x-www-form-urlencoded body.
 * Base: https://urlhaus-api.abuse.ch/v1
 *
 * Tools:
 * - lookup_url: Look up a URL to check if it hosts malware
 * - lookup_host: Look up a hostname or IP for associated malware URLs
 * - get_recent: Get recently submitted malware URLs
 * - lookup_payload: Look up a malware payload by MD5 or SHA256 hash
 */


const BASE_URL = 'https://urlhaus-api.abuse.ch/v1';

type RawUrlLookup = {
  query_status: string;
  id?: string;
  url_status?: string;
  date_added?: string;
  threat?: string;
  blacklists?: Record<string, string>;
  urls_on_this_host?: unknown[];
  tags?: string[] | null;
};

type RawHostLookup = {
  query_status: string;
  urlhaus_reference?: string;
  blacklists?: Record<string, string>;
  urls?: Array<{
    id: string;
    url_status: string;
    date_added: string;
    url: string;
    threat: string;
    tags: string[] | null;
  }>;
};

type RawRecentUrl = {
  id: string;
  url_status: string;
  date_added: string;
  url: string;
  threat: string;
  tags: string[] | null;
  urlhaus_reference: string;
};

type RawRecentResponse = {
  query_status: string;
  urls: RawRecentUrl[];
};

type RawPayloadLookup = {
  query_status: string;
  md5_hash?: string;
  sha256_hash?: string;
  file_type?: string;
  file_size?: number;
  signature?: string | null;
  firstseen?: string;
  lastseen?: string;
  url_count?: number;
  urls_on_this_payload?: unknown[];
};

async function postForm(endpoint: string, body: Record<string, string>) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body).toString(),
  });
  if (!res.ok) throw new Error(`URLhaus API error: ${res.status}`);
  return res.json();
}

const tools: McpToolExport['tools'] = [
  {
    name: 'lookup_url',
    description:
      'Look up a URL in the URLhaus malware database to check if it is known to host or distribute malware. Returns threat category, status, blacklist status, and tags.',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The full URL to look up (e.g. "http://example.com/malware.exe").',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'lookup_host',
    description:
      'Look up a hostname or IP address in the URLhaus database to find associated malware URLs. Returns all known malicious URLs hosted on that host.',
    inputSchema: {
      type: 'object',
      properties: {
        host: {
          type: 'string',
          description:
            'Hostname or IP address to look up (e.g. "example.com" or "192.168.1.1").',
        },
      },
      required: ['host'],
    },
  },
  {
    name: 'get_recent',
    description:
      'Get a list of recently submitted malware URLs from URLhaus. Useful for monitoring the latest threats.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Number of recent URLs to return (default 10, max 1000).',
        },
      },
      required: [],
    },
  },
  {
    name: 'lookup_payload',
    description:
      'Look up a malware payload file by its MD5 or SHA256 hash in the URLhaus database. Returns file type, size, first/last seen dates, and associated delivery URLs.',
    inputSchema: {
      type: 'object',
      properties: {
        md5_hash: {
          type: 'string',
          description: 'MD5 hash of the payload to look up (32 hex characters).',
        },
        sha256_hash: {
          type: 'string',
          description: 'SHA256 hash of the payload to look up (64 hex characters).',
        },
      },
      required: [],
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'lookup_url':
      return lookupUrl(args.url as string);
    case 'lookup_host':
      return lookupHost(args.host as string);
    case 'get_recent':
      return getRecent((args.limit as number | undefined) ?? 10);
    case 'lookup_payload': {
      const md5 = args.md5_hash as string | undefined;
      const sha256 = args.sha256_hash as string | undefined;
      if (!md5 && !sha256) throw new Error('Either md5_hash or sha256_hash is required.');
      return lookupPayload(md5, sha256);
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function lookupUrl(url: string) {
  const data = (await postForm('/url/', { url })) as RawUrlLookup;
  return {
    query_status: data.query_status,
    id: data.id ?? null,
    url_status: data.url_status ?? null,
    date_added: data.date_added ?? null,
    threat: data.threat ?? null,
    tags: data.tags ?? null,
    blacklists: data.blacklists ?? null,
  };
}

async function lookupHost(host: string) {
  const data = (await postForm('/host/', { host })) as RawHostLookup;
  return {
    query_status: data.query_status,
    urlhaus_reference: data.urlhaus_reference ?? null,
    blacklists: data.blacklists ?? null,
    url_count: data.urls?.length ?? 0,
    urls: (data.urls ?? []).map((u) => ({
      id: u.id,
      url: u.url,
      url_status: u.url_status,
      date_added: u.date_added,
      threat: u.threat,
      tags: u.tags,
    })),
  };
}

async function getRecent(limit: number) {
  const data = (await postForm('/urls/recent/', {
    limit: String(Math.min(limit, 1000)),
  })) as RawRecentResponse;
  return {
    query_status: data.query_status,
    count: data.urls?.length ?? 0,
    urls: (data.urls ?? []).map((u) => ({
      id: u.id,
      url: u.url,
      url_status: u.url_status,
      date_added: u.date_added,
      threat: u.threat,
      tags: u.tags,
      urlhaus_reference: u.urlhaus_reference,
    })),
  };
}

async function lookupPayload(md5?: string, sha256?: string) {
  const body: Record<string, string> = {};
  if (md5) body['md5_hash'] = md5;
  else if (sha256) body['sha256_hash'] = sha256;
  const data = (await postForm('/payload/', body)) as RawPayloadLookup;
  return {
    query_status: data.query_status,
    md5_hash: data.md5_hash ?? null,
    sha256_hash: data.sha256_hash ?? null,
    file_type: data.file_type ?? null,
    file_size_bytes: data.file_size ?? null,
    signature: data.signature ?? null,
    first_seen: data.firstseen ?? null,
    last_seen: data.lastseen ?? null,
    url_count: data.url_count ?? null,
    delivery_urls: data.urls_on_this_payload ?? [],
  };
}

export default { tools, callTool, meter: { credits: 5 } } satisfies McpToolExport;
