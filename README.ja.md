# @imrieul/mysql-mcp-server

[English](./README.md) | [한국어](./README.ko.md) | [中文](./README.zh.md) | [Español](./README.es.md) | [Português](./README.pt.md) | [Français](./README.fr.md) | [Русский](./README.ru.md)

シンプルなMySQL [MCP](https://modelcontextprotocol.io/)サーバーです。

## 特徴

- **LLM最適化** — コンパクトなカラム/行形式、自動LIMIT、次のアクション提案を含むエラーヒント
- **一括スキーマ取得** — `describe_all_tables`で全データベーススキーマを一度に取得
- **読み取り専用モード** — アプリケーションレベルのプレフィックスチェック + データベースレベルの`SET SESSION TRANSACTION READ ONLY`
- **クエリタイムアウト** — `Promise.race()`ベースのタイムアウトと確実なコネクションクリーンアップ
- **SSL対応** — 環境変数1つで暗号化接続を有効化
- **ミニマル** — 依存関係3つ、設定不要

## クイックスタート

MCPの設定ファイル（`.mcp.json`または`claude_desktop_config.json`）に追加してください。

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

接続文字列を使用する場合:

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

### SSLを使用した読み取り専用モード

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

## ツール

| Tool | Description | Read-only mode |
|------|-------------|----------------|
| `query` | SELECT, SHOW, DESCRIBE, EXPLAINの実行 | 許可 |
| `execute` | INSERT, UPDATE, DELETE, DDLの実行 | ブロック |
| `list_databases` | 全データベースの一覧表示 | 許可 |
| `list_tables` | データベース内のテーブル一覧表示 | 許可 |
| `describe_table` | テーブルスキーマの表示 | 許可 |
| `describe_all_tables` | 全テーブルスキーマの一括表示 | 許可 |

## 設定

### 環境変数

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MYSQL_HOST` | はい | — | MySQLホスト |
| `MYSQL_USER` | はい | — | MySQLユーザー |
| `MYSQL_PASSWORD` | はい | — | MySQLパスワード |
| `MYSQL_PORT` | いいえ | `3306` | MySQLポート |
| `MYSQL_DATABASE` | いいえ | — | デフォルトデータベース |
| `MYSQL_READONLY` | いいえ | `false` | 読み取り専用モード |
| `MYSQL_MAX_ROWS` | いいえ | `100` | SELECTクエリの自動LIMIT |
| `MYSQL_QUERY_TIMEOUT` | いいえ | `30000` | クエリタイムアウト(ミリ秒、0で無効化) |
| `MYSQL_SSL` | いいえ | `false` | SSL接続を有効化 |

### 接続文字列

```
mysql://user:password@host:port/database
```

最初のCLI引数として渡されます。環境変数より優先されます。

## ライセンス

MIT
