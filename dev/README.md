# Local WordPress tester

```
cd dev
docker compose up -d
docker compose run --rm setup      # first time only: installs WP, activates plugin
```

- Site: http://localhost:8085 (port 8085 to avoid clashing with anything on 80/8080)
- Admin: http://localhost:8085/wp-admin, user `admin`, password `admin`
- The plugin folder `../wp-chat` is mounted live; edit and reload.
- Backend URL defaults to `https://localhost:3443` (switchboard-chat's HTTPS port). Override with
  `BACKEND_URL=https://other docker compose run --rm setup`, or in Settings > WP Chat.
  The backend must allow origin `http://localhost:8085` (`WEB_ALLOWED_ORIGINS`), and its self-signed
  certificate must be accepted once in the browser (visit the URL and proceed).
- Reset everything: `docker compose down -v`
