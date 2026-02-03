# @imrieul/mysql-mcp-server

[English](./README.md) | [日本語](./README.ja.md) | [中文](./README.zh.md) | [Español](./README.es.md) | [Português](./README.pt.md) | [Français](./README.fr.md) | [Русский](./README.ru.md)

간단한 MySQL [MCP](https://modelcontextprotocol.io/) 서버입니다.

## 특징

- **LLM 친화적** — 압축된 컬럼/행 형식, 자동 LIMIT, 다음 작업 제안이 포함된 오류 힌트
- **일괄 스키마 조회** — `describe_all_tables`로 전체 DB 스키마를 한 번에 조회
- **읽기 전용 모드** — 애플리케이션 레벨 접두사 검사 + DB 레벨 `SET SESSION TRANSACTION READ ONLY`
- **쿼리 타임아웃** — `Promise.race()` 기반 타임아웃 및 연결 정리 보장
- **SSL 지원** — 환경 변수 하나로 암호화된 연결 활성화
- **미니멀** — 3개의 의존성, 설정 불필요

## 빠른 시작

MCP 설정 파일(`.mcp.json` 또는 `claude_desktop_config.json`)에 추가하세요:

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

또는 연결 문자열 사용:

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

### SSL을 사용하는 읽기 전용 모드

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

## 도구

| Tool | 설명 | 읽기 전용 모드 |
|------|------|---------------|
| `query` | SELECT, SHOW, DESCRIBE, EXPLAIN 실행 | 허용 |
| `execute` | INSERT, UPDATE, DELETE, DDL 실행 | 차단 |
| `list_databases` | 모든 데이터베이스 목록 조회 | 허용 |
| `list_tables` | 데이터베이스의 테이블 목록 조회 | 허용 |
| `describe_table` | 테이블 스키마 조회 | 허용 |
| `describe_all_tables` | 모든 테이블 스키마를 한 번에 조회 | 허용 |

## 설정

### 환경 변수

| 변수 | 필수 | 기본값 | 설명 |
|------|------|--------|------|
| `MYSQL_HOST` | Yes | — | MySQL 호스트 |
| `MYSQL_USER` | Yes | — | MySQL 사용자 |
| `MYSQL_PASSWORD` | Yes | — | MySQL 비밀번호 |
| `MYSQL_PORT` | No | `3306` | MySQL 포트 |
| `MYSQL_DATABASE` | No | — | 기본 데이터베이스 |
| `MYSQL_READONLY` | No | `false` | 읽기 전용 모드 |
| `MYSQL_MAX_ROWS` | No | `100` | SELECT 쿼리의 자동 LIMIT |
| `MYSQL_QUERY_TIMEOUT` | No | `30000` | 쿼리 타임아웃 (밀리초, 0으로 비활성화) |
| `MYSQL_SSL` | No | `false` | SSL 연결 활성화 |

### 연결 문자열

```
mysql://user:password@host:port/database
```

첫 번째 CLI 인수로 전달됩니다. 환경 변수보다 우선합니다.

## 라이선스

MIT
