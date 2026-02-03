# @imrieul/mysql-mcp-server

[한국어](./README.ko.md) | [日本語](./README.ja.md) | [中文](./README.zh.md) | [Español](./README.es.md) | [Português](./README.pt.md) | [Français](./README.fr.md) | [Русский](./README.ru.md)

A simple MySQL [MCP](https://modelcontextprotocol.io/) server.

## Features

- **LLM-friendly** — compact column/row format, auto LIMIT, error hints with next-action suggestions
- **Bulk schema** — `describe_all_tables` returns entire DB schema in one call
- **Read-only mode** — app-level prefix check + DB-level `SET SESSION TRANSACTION READ ONLY`
- **Query timeout** — `Promise.race()` based timeout with guaranteed connection cleanup
- **SSL support** — one env var to enable encrypted connections
- **Minimal** — 3 dependencies, zero config required

## Quick Start

Add to your MCP config (`.mcp.json` or `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "mysql": {
      "command": "npx",
      "args": ["-y", "@imrieul/mysql-mcp-server"],
      "env": {
        "MYSQL_HOST": "localhost",
        "MYSQL_PORT": "3306",
        "MYSQL_USER": "root",
        "MYSQL_PASSWORD": "your-password",
        "MYSQL_DATABASE": "your-database"
      }
    }
  }
}
```

Or with a connection string:

```json
{
  "mcpServers": {
    "mysql": {
      "command": "npx",
      "args": ["-y", "@imrieul/mysql-mcp-server", "mysql://root:password@localhost:3306/mydb"]
    }
  }
}
```

### Read-only mode with SSL

```json
{
  "mcpServers": {
    "mysql": {
      "command": "npx",
      "args": ["-y", "@imrieul/mysql-mcp-server", "--readonly"],
      "env": {
        "MYSQL_HOST": "db.example.com",
        "MYSQL_USER": "readonly_user",
        "MYSQL_PASSWORD": "password",
        "MYSQL_DATABASE": "production",
        "MYSQL_SSL": "true",
        "MYSQL_QUERY_TIMEOUT": "10000"
      }
    }
  }
}
```

## Tools

| Tool | Description | Read-only mode |
|------|-------------|----------------|
| `query` | Execute SELECT, SHOW, DESCRIBE, EXPLAIN | Allowed |
| `execute` | Execute INSERT, UPDATE, DELETE, DDL | Blocked |
| `list_databases` | List all databases | Allowed |
| `list_tables` | List tables in a database | Allowed |
| `describe_table` | Show table schema | Allowed |
| `describe_all_tables` | Show all table schemas at once | Allowed |

## Configuration

### Environment variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MYSQL_HOST` | Yes | — | MySQL host |
| `MYSQL_USER` | Yes | — | MySQL user |
| `MYSQL_PASSWORD` | Yes | — | MySQL password |
| `MYSQL_PORT` | No | `3306` | MySQL port |
| `MYSQL_DATABASE` | No | — | Default database |
| `MYSQL_READONLY` | No | `false` | Read-only mode |
| `MYSQL_MAX_ROWS` | No | `100` | Auto LIMIT for SELECT queries |
| `MYSQL_QUERY_TIMEOUT` | No | `30000` | Query timeout in ms (0 to disable) |
| `MYSQL_SSL` | No | `false` | Enable SSL connection |

### Connection string

```
mysql://user:password@host:port/database
```

Passed as the first CLI argument. Takes priority over environment variables.

## License

MIT
