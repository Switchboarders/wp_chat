[English](README.md) · **Français**

# Site WordPress d’essai local

```
cd dev
docker compose up -d
docker compose run --rm setup      # la première fois seulement : installe WP, active le module
```

- Site : http://localhost:8085 (port 8085 pour éviter les conflits avec ce qui utilise 80/8080)
- Administration : http://localhost:8085/wp-admin, utilisateur `admin`, mot de passe `admin`
- Le dossier du module `../wp-chat` est monté en direct; modifiez et rechargez.
- L’URL du serveur est `https://localhost:3443` par défaut (le port HTTPS de switchboard-chat). Pour la
  changer : `BACKEND_URL=https://autre docker compose run --rm setup`, ou dans Réglages > WP Chat. Le
  serveur doit autoriser l’origine `http://localhost:8085` (`WEB_ALLOWED_ORIGINS`), et son certificat
  autosigné doit être accepté une fois dans le navigateur (visitez l’adresse et continuez).
- Tout réinitialiser : `docker compose down -v`
