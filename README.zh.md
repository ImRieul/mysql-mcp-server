# @imrieul/mysql-mcp-server

[English](./README.md) | [한국어](./README.ko.md) | [日本語](./README.ja.md) | [Español](./README.es.md) | [Português](./README.pt.md) | [Français](./README.fr.md) | [Русский](./README.ru.md)

一个简单的 MySQL [MCP](https://modelcontextprotocol.io/) 服务器。

## 功能特性

- **LLM 友好** — 紧凑的列/行格式，自动 LIMIT，提供错误提示和下一步操作建议
- **批量模式架构** — `describe_all_tables` 一次调用返回整个数据库架构
- **只读模式** — 应用层前缀检查 + 数据库层 `SET SESSION TRANSACTION READ ONLY`
- **查询超时** — 基于 `Promise.race()` 的超时机制，确保连接清理
- **SSL 支持** — 通过一个环境变量即可启用加密连接
- **极简设计** — 仅 3 个依赖，无需配置即可使用

## 快速开始

将以下内容添加到您的 MCP 配置文件（`.mcp.json` 或 `claude_desktop_config.json`）：

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

或使用连接字符串：

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

### 启用 SSL 的只读模式

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

## 工具

| 工具 | 描述 | 只读模式 |
|------|------|---------|
| `query` | 执行 SELECT、SHOW、DESCRIBE、EXPLAIN | 允许 |
| `execute` | 执行 INSERT、UPDATE、DELETE、DDL | 阻止 |
| `list_databases` | 列出所有数据库 | 允许 |
| `list_tables` | 列出数据库中的表 | 允许 |
| `describe_table` | 显示表架构 | 允许 |
| `describe_all_tables` | 一次性显示所有表架构 | 允许 |

## 配置

### 环境变量

| 变量 | 必需 | 默认值 | 描述 |
|------|------|--------|------|
| `MYSQL_HOST` | 是 | — | MySQL 主机地址 |
| `MYSQL_USER` | 是 | — | MySQL 用户名 |
| `MYSQL_PASSWORD` | 是 | — | MySQL 密码 |
| `MYSQL_PORT` | 否 | `3306` | MySQL 端口 |
| `MYSQL_DATABASE` | 否 | — | 默认数据库 |
| `MYSQL_READONLY` | 否 | `false` | 只读模式 |
| `MYSQL_MAX_ROWS` | 否 | `100` | SELECT 查询自动 LIMIT 行数 |
| `MYSQL_QUERY_TIMEOUT` | 否 | `30000` | 查询超时时间（毫秒，0 表示禁用） |
| `MYSQL_SSL` | 否 | `false` | 启用 SSL 连接 |

### 连接字符串

```
mysql://user:password@host:port/database
```

作为第一个 CLI 参数传递。优先级高于环境变量。

## 许可证

MIT
