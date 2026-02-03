# @imrieul/mysql-mcp-server

[English](./README.md) | [한국어](./README.ko.md) | [日本語](./README.ja.md) | [中文](./README.zh.md) | [Español](./README.es.md) | [Português](./README.pt.md) | [Français](./README.fr.md)

Простой MySQL-сервер [MCP](https://modelcontextprotocol.io/).

## Возможности

- **LLM-friendly** — компактный формат столбцов/строк, автоматический LIMIT, подсказки об ошибках с предложениями следующих действий
- **Массовая схема** — `describe_all_tables` возвращает полную схему БД за один вызов
- **Режим только для чтения** — проверка префикса на уровне приложения + `SET SESSION TRANSACTION READ ONLY` на уровне БД
- **Тайм-аут запросов** — тайм-аут на основе `Promise.race()` с гарантированной очисткой соединения
- **Поддержка SSL** — одна переменная окружения для включения зашифрованных соединений
- **Минималистичность** — 3 зависимости, нулевая конфигурация

## Быстрый старт

Добавьте в конфигурацию MCP (`.mcp.json` или `claude_desktop_config.json`):

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

Или с использованием строки подключения:

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

### Режим только для чтения с SSL

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

## Инструменты

| Инструмент | Описание | Режим только для чтения |
|------------|----------|-------------------------|
| `query` | Выполнение SELECT, SHOW, DESCRIBE, EXPLAIN | Разрешено |
| `execute` | Выполнение INSERT, UPDATE, DELETE, DDL | Заблокировано |
| `list_databases` | Список всех баз данных | Разрешено |
| `list_tables` | Список таблиц в базе данных | Разрешено |
| `describe_table` | Отображение схемы таблицы | Разрешено |
| `describe_all_tables` | Отображение всех схем таблиц одновременно | Разрешено |

## Конфигурация

### Переменные окружения

| Переменная | Обязательная | По умолчанию | Описание |
|------------|--------------|--------------|----------|
| `MYSQL_HOST` | Да | — | Хост MySQL |
| `MYSQL_USER` | Да | — | Пользователь MySQL |
| `MYSQL_PASSWORD` | Да | — | Пароль MySQL |
| `MYSQL_PORT` | Нет | `3306` | Порт MySQL |
| `MYSQL_DATABASE` | Нет | — | База данных по умолчанию |
| `MYSQL_READONLY` | Нет | `false` | Режим только для чтения |
| `MYSQL_MAX_ROWS` | Нет | `100` | Автоматический LIMIT для SELECT-запросов |
| `MYSQL_QUERY_TIMEOUT` | Нет | `30000` | Тайм-аут запроса в мс (0 для отключения) |
| `MYSQL_SSL` | Нет | `false` | Включить SSL-соединение |

### Строка подключения

```
mysql://user:password@host:port/database
```

Передается как первый аргумент CLI. Имеет приоритет над переменными окружения.

## Лицензия

MIT
