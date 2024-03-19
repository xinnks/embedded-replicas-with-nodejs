# Embedded replicas with NodeJs

A recipe book CRUD API featuring [Turso embedded replicas](https://docs.turso.tech/features/embedded-replicas) and [HonoJs](https://github.com/honojs/hono).

## Development

Create a turso database.

```sh
turso db create <db-name>
```

Get the database credentials:

```sh
# db url
turso db show --url <db-name>

# authentication token
turso db tokens create <db-name>
```

Store the credentials inside a `.env` file:

```text
TURSO_DATABASE_URL
TURSO_AUTH_TOKEN
```

## Run project

In development:

```sh
npm run dev
```

In production:

```sh
npm run start
```

Add a new recipe:

```sh
curl "http://127.0.0.1:8080/todos" \
  -X POST \
  -H 'Content-Type: application/json' \
  -d '{ "recipe": { "name": "Recipe 1", "nutritionInformation": "Vitamin A, Vitamin B", "instructions": "Do abc" }, "ingredients": [{ "name": "ingredient 1", "measurements": "2 cups" }] }'
```

Get the list of added tasks:

```sh
curl "http://127.0.0.1:8080/todos"
```
