# API21

A general purpose backend for my side-projects

## Environment Variables

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

## Admin Endpoints

### Kill/Restart Server

Triggers a server shutdown with restart exit code.

```bash
curl -X POST -H "x-admin-secret: your-secret-token" localhost:3000/admin/kill
```
