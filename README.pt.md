# @imrieul/mysql-mcp-server

[English](./README.md) | [한국어](./README.ko.md) | [日本語](./README.ja.md) | [中文](./README.zh.md) | [Español](./README.es.md) | [Français](./README.fr.md) | [Русский](./README.ru.md)

Um servidor [MCP](https://modelcontextprotocol.io/) simples para MySQL.

## Recursos

- **Otimizado para LLM** — formato compacto de colunas/linhas, LIMIT automático, dicas de erro com sugestões de próximas ações
- **Schema em lote** — `describe_all_tables` retorna o schema completo do banco em uma única chamada
- **Modo somente leitura** — verificação de prefixo no nível da aplicação + `SET SESSION TRANSACTION READ ONLY` no nível do banco
- **Timeout de consulta** — timeout baseado em `Promise.race()` com limpeza garantida da conexão
- **Suporte a SSL** — uma variável de ambiente para habilitar conexões criptografadas
- **Minimalista** — 3 dependências, zero configuração necessária

## Início Rápido

Adicione à sua configuração MCP (`.mcp.json` ou `claude_desktop_config.json`):

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

Ou com uma string de conexão:

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

### Modo somente leitura com SSL

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

## Ferramentas

| Ferramenta | Descrição | Modo somente leitura |
|------|-------------|----------------|
| `query` | Executar SELECT, SHOW, DESCRIBE, EXPLAIN | Permitido |
| `execute` | Executar INSERT, UPDATE, DELETE, DDL | Bloqueado |
| `list_databases` | Listar todos os bancos de dados | Permitido |
| `list_tables` | Listar tabelas em um banco de dados | Permitido |
| `describe_table` | Exibir schema da tabela | Permitido |
| `describe_all_tables` | Exibir schemas de todas as tabelas de uma vez | Permitido |

## Configuração

### Variáveis de ambiente

| Variável | Obrigatória | Padrão | Descrição |
|----------|----------|---------|-------------|
| `MYSQL_HOST` | Sim | — | Host do MySQL |
| `MYSQL_USER` | Sim | — | Usuário do MySQL |
| `MYSQL_PASSWORD` | Sim | — | Senha do MySQL |
| `MYSQL_PORT` | Não | `3306` | Porta do MySQL |
| `MYSQL_DATABASE` | Não | — | Banco de dados padrão |
| `MYSQL_READONLY` | Não | `false` | Modo somente leitura |
| `MYSQL_MAX_ROWS` | Não | `100` | LIMIT automático para consultas SELECT |
| `MYSQL_QUERY_TIMEOUT` | Não | `30000` | Timeout de consulta em ms (0 para desabilitar) |
| `MYSQL_SSL` | Não | `false` | Habilitar conexão SSL |

### String de conexão

```
mysql://user:password@host:port/database
```

Passada como primeiro argumento CLI. Tem prioridade sobre as variáveis de ambiente.

## Licença

MIT
