# @imrieul/mysql-mcp-server

[English](./README.md) | [한국어](./README.ko.md) | [日本語](./README.ja.md) | [中文](./README.zh.md) | [Español](./README.es.md) | [Português](./README.pt.md) | [Русский](./README.ru.md)

Un serveur [MCP](https://modelcontextprotocol.io/) MySQL simple.

## Fonctionnalités

- **Compatible LLM** — format colonnes/lignes compact, LIMIT automatique, suggestions d'actions suite aux erreurs
- **Schéma en masse** — `describe_all_tables` retourne le schéma complet de la base en un seul appel
- **Mode lecture seule** — vérification au niveau applicatif + `SET SESSION TRANSACTION READ ONLY` au niveau base de données
- **Timeout des requêtes** — timeout basé sur `Promise.race()` avec nettoyage garanti des connexions
- **Support SSL** — une seule variable d'environnement pour activer les connexions chiffrées
- **Minimal** — 3 dépendances, aucune configuration requise

## Démarrage rapide

Ajoutez à votre configuration MCP (`.mcp.json` ou `claude_desktop_config.json`) :

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

Ou avec une chaîne de connexion :

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

### Mode lecture seule avec SSL

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

## Outils

| Outil | Description | Mode lecture seule |
|------|-------------|----------------|
| `query` | Exécuter SELECT, SHOW, DESCRIBE, EXPLAIN | Autorisé |
| `execute` | Exécuter INSERT, UPDATE, DELETE, DDL | Bloqué |
| `list_databases` | Lister toutes les bases de données | Autorisé |
| `list_tables` | Lister les tables d'une base de données | Autorisé |
| `describe_table` | Afficher le schéma d'une table | Autorisé |
| `describe_all_tables` | Afficher tous les schémas de tables en une fois | Autorisé |

## Configuration

### Variables d'environnement

| Variable | Requis | Défaut | Description |
|----------|----------|---------|-------------|
| `MYSQL_HOST` | Oui | — | Hôte MySQL |
| `MYSQL_USER` | Oui | — | Utilisateur MySQL |
| `MYSQL_PASSWORD` | Oui | — | Mot de passe MySQL |
| `MYSQL_PORT` | Non | `3306` | Port MySQL |
| `MYSQL_DATABASE` | Non | — | Base de données par défaut |
| `MYSQL_READONLY` | Non | `false` | Mode lecture seule |
| `MYSQL_MAX_ROWS` | Non | `100` | LIMIT automatique pour les requêtes SELECT |
| `MYSQL_QUERY_TIMEOUT` | Non | `30000` | Timeout des requêtes en ms (0 pour désactiver) |
| `MYSQL_SSL` | Non | `false` | Activer la connexion SSL |

### Chaîne de connexion

```
mysql://user:password@host:port/database
```

Passée comme premier argument CLI. Prioritaire sur les variables d'environnement.

## Licence

MIT
