# Project Name

## Description

This project is a full-stack application with a React frontend and an Express backend. It includes user authentication, email verification, password reset, and more.

For more detailed documentation, please refer to the [prd](./docs/prd.md).

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher) or yarn
- Docker

## Installation

1. Clone the repository:

```sh
git clone https://github.com/Tonio2/boilerplate.git
cd boilerplate
```

2. Create environment variable files:

```sh
# Docker env variables
cp .env.example .env

# Server environment variables
cd ../server
cp .env.example .env

# Client environment variables
cd ../client
cp .env.example .env
```

3. Update the .env files with your configuration.

4. Install dependencies for both client and server:

```sh
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

5. Initiate db schemas:

```sh
# Start db
docker compose up -d

# Initiate schemas
cd server
npm run db:push
```


## Running the Project

1. Start the postgres server:

```sh
docker compose up -d
```

2. Start the backend server:

```sh
cd server
npm run dev
```

3. Start the frontend client:

```sh
cd client
npm start
```

## Push to prod

# TODO

Your app is accessible at `http://localhost:5000` and the api at `http://localhost:5000/api`

## Database Management

### Development Commands

```bash
# Push schema changes to database (development only)
npm run db:push

# Generate migration files
npm run db:generate

# Run migrations (production)
npm run db:migrate

# Open Drizzle Studio (database GUI)
npm run db:studio
```

### Accessing the Database

**Via Drizzle Studio:**
```bash
cd server
npm run db:studio
```
Opens at `https://local.drizzle.studio`

**Via psql CLI:**
```bash
docker exec -it boilerplate-postgres psql -U postgres -d boilerplate
```

**Via any PostgreSQL client:**
- Host: localhost
- Port: 5432
- Database: boilerplate
- Username: postgres
- Password: postgres
