# mcp-urlhaus

URLhaus MCP — wraps abuse.ch URLhaus malware URL database (free, no auth)

Part of the [Pipeworx](https://pipeworx.io) open MCP gateway.

## Tools

| Tool | Description |
|------|-------------|

## Quick Start

Add to your MCP client config:

```json
{
  "mcpServers": {
    "urlhaus": {
      "url": "https://gateway.pipeworx.io/urlhaus/mcp"
    }
  }
}
```

Or use the CLI:

```bash
npx pipeworx use urlhaus
```

## License

MIT
