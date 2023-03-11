# Decent Debates

## Setting up

### The root `.env` file

These variables are going to be used to configure the local Postgres instance.

```bash
# Ensure you're in the root folder.
cp .env.example .env
```

### The `api` `.env` file

Here the cookie secret should be provided.

```bash
# Ensure you're in the `api` directory.
cp .env.example .env
```

---

## Spinning up the application

1. Start the containers

    ```bash
    docker-compose up
    ```

## My Research

I came up with many questions while working on this project:

* [JWT vs Sessions](https://hollow-soccer-dbb.notion.site/JWT-vs-Sessions-10068cc24cb0490cbeb4a30a06297ed7)
* [Why I decided not to use an ORM](https://hollow-soccer-dbb.notion.site/Why-I-decided-not-to-use-an-ORM-08b79f90900648a4a702c63d0bee030d)