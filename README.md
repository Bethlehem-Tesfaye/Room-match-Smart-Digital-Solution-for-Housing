# RoomMatch

A full-stack rental and roommate-matching platform. Tenants and owners use the **frontend** app; moderators use the **admin** panel. The **server** provides REST APIs, auth, payments (Chapa), messaging, and MongoDB persistence.

## Repository structure

| Folder      | Stack                             | Purpose                                        |
| ----------- | --------------------------------- | ---------------------------------------------- |
| `frontend/` | React, TypeScript, Vite, Tailwind | User app (browse, list, rent, chat, roommates) |
| `admin/`    | React, Vite                       | Admin dashboard (users, properties, reports)   |
| `server/`   | Node.js, Express, Mongoose        | API, auth, database, Socket.IO                 |

## Features

- User registration, login, email verification
- Property listings (create, edit, search, save)
- Rent requests and contract workflow
- Online rent payment and receipts (Chapa)
- In-app messaging and notifications
- Roommate preferences and matching
- Admin moderation and user management

## Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Environment variables (see `.env.example` in each app)

## Quick start

### 1. Server

```bash
cd server
npm install
cp .env.example .env   # if present; configure MongoDB, secrets, Chapa, etc.
npm run dev
```
