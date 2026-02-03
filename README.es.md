# @imrieul/mysql-mcp-server

[English](./README.md) | [한국어](./README.ko.md) | [日本語](./README.ja.md) | [中文](./README.zh.md) | [Português](./README.pt.md) | [Français](./README.fr.md) | [Русский](./README.ru.md)

Un servidor [MCP](https://modelcontextprotocol.io/) simple para MySQL.

## Características

- **Optimizado para LLM** — formato compacto de columnas/filas, LIMIT automático, sugerencias de error con acciones sugeridas
- **Esquema en bloque** — `describe_all_tables` devuelve todo el esquema de la base de datos en una sola llamada
- **Modo de solo lectura** — verificación de prefijo a nivel de aplicación + `SET SESSION TRANSACTION READ ONLY` a nivel de base de datos
- **Tiempo de espera de consultas** — tiempo de espera basado en `Promise.race()` con limpieza de conexión garantizada
- **Soporte SSL** — una variable de entorno para habilitar conexiones cifradas
- **Minimalista** — 3 dependencias, sin configuración requerida

## Inicio Rápido

Añade a tu configuración MCP (`.mcp.json` o `claude_desktop_config.json`):

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

O con una cadena de conexión:

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

### Modo de solo lectura con SSL

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

## Herramientas

| Tool | Descripción | Modo de solo lectura |
|------|-------------|----------------------|
| `query` | Ejecutar SELECT, SHOW, DESCRIBE, EXPLAIN | Permitido |
| `execute` | Ejecutar INSERT, UPDATE, DELETE, DDL | Bloqueado |
| `list_databases` | Listar todas las bases de datos | Permitido |
| `list_tables` | Listar tablas en una base de datos | Permitido |
| `describe_table` | Mostrar esquema de tabla | Permitido |
| `describe_all_tables` | Mostrar todos los esquemas de tabla a la vez | Permitido |

## Configuración

### Variables de entorno

| Variable | Requerida | Por defecto | Descripción |
|----------|-----------|-------------|-------------|
| `MYSQL_HOST` | Sí | — | Host de MySQL |
| `MYSQL_USER` | Sí | — | Usuario de MySQL |
| `MYSQL_PASSWORD` | Sí | — | Contraseña de MySQL |
| `MYSQL_PORT` | No | `3306` | Puerto de MySQL |
| `MYSQL_DATABASE` | No | — | Base de datos por defecto |
| `MYSQL_READONLY` | No | `false` | Modo de solo lectura |
| `MYSQL_MAX_ROWS` | No | `100` | LIMIT automático para consultas SELECT |
| `MYSQL_QUERY_TIMEOUT` | No | `30000` | Tiempo de espera de consulta en ms (0 para deshabilitar) |
| `MYSQL_SSL` | No | `false` | Habilitar conexión SSL |

### Cadena de conexión

```
mysql://user:password@host:port/database
```

Se pasa como el primer argumento CLI. Tiene prioridad sobre las variables de entorno.

## Licencia

MIT
