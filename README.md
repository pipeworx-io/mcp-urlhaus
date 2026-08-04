# mcp-urlhaus

URLhaus MCP — wraps abuse.ch URLhaus malware URL database (free, no auth)

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `lookup_url` | Look up a URL in the URLhaus malware database to check if it is known to host or distribute malware. Returns threat category, status, blacklist status, and tags. |
| `lookup_host` | Look up a hostname or IP address in the URLhaus database to find associated malware URLs. Returns all known malicious URLs hosted on that host. |
| `get_recent` | Get a list of recently submitted malware URLs from URLhaus. Useful for monitoring the latest threats. |
| `lookup_payload` | Look up a malware payload file by its MD5 or SHA256 hash in the URLhaus database. Returns file type, size, first/last seen dates, and associated delivery URLs. |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "urlhaus": {
      "url": "https://gateway.pipeworx.io/urlhaus/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Urlhaus data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
