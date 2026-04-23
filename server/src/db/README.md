# Postgres Migration

Este diretorio prepara a migracao do store JSON atual para Postgres sem mudar o contrato da dashboard.

## Arquivos

- `schema.sql`: schema relacional equivalente ao store persistido em `server/data/dashboard-store.json`
- `generate-store-seed-sql.ts`: le o store atual e gera um arquivo SQL com `INSERT ... ON CONFLICT`

## Ordem recomendada

1. Criar o banco Postgres.
2. Aplicar `schema.sql`.
3. Rodar o gerador de seed SQL.
4. Executar o arquivo SQL gerado no banco.
5. Subir o backend com `DATA_PROVIDER=postgres`, mantendo o mesmo agregador.

## Comandos

Gerar o seed SQL a partir do store atual:

```bash
npm run db:generate-seed-sql
```

O script escreve em:

```text
server/data/dashboard-seed.sql
```

Aplicar o schema:

```bash
psql "$DATABASE_URL" -f server/src/db/schema.sql
```

Aplicar o seed:

```bash
psql "$DATABASE_URL" -f server/data/dashboard-seed.sql
```

## Variaveis de ambiente para YouTube OAuth

No backend:

- `YOUTUBE_CLIENT_ID`
- `YOUTUBE_CLIENT_SECRET`
- `YOUTUBE_REDIRECT_URI`
- `FRONTEND_APP_URL`
- `YOUTUBE_SYNC_INTERVAL_MINUTES`

Exemplo de callback em Railway:

```text
https://api.seudominio.com/auth/youtube/callback
```

Exemplo de tela final no frontend:

```text
https://app.seudominio.com/connections
```

Para scheduler opcional na Railway:

```text
YOUTUBE_SYNC_INTERVAL_MINUTES=15
```

Se estiver `0` ou ausente, o scheduler fica desligado e o sync pode ser acionado manualmente por rota admin.

## Railway

Para rodar na Railway:

- provisionar um banco PostgreSQL no projeto
- expor `DATABASE_URL` para o serviço backend
- definir `DATA_PROVIDER=postgres`
- manter `PORT` vindo da propria Railway

O backend valida a conexao com o banco no boot quando `DATA_PROVIDER=postgres`.

O endpoint `/health` passa a indicar o provider ativo.

## Mapeamento do store JSON

- `platforms` -> tabela `platforms`
- `accounts` -> tabela `accounts`
- `connections` -> tabela `account_connections`
- `snapshots` -> tabela `metric_snapshots`
- `events` -> tabela `activity_events`
- `cases` -> tabela `case_studies`

## Observacoes

- O schema usa `TEXT` como chave primaria para preservar os ids atuais e simplificar a migracao.
- `chart_data` dos cases fica em `JSONB` para preservar a estrutura atual sem perda.
- O schema inclui views auxiliares para leitura do ultimo snapshot por conta e deltas entre snapshots.
- O backend agora suporta `json` e `postgres` por variavel de ambiente, sem alterar o payload da home.
