# Project Name

## Description

This project is a full-stack application with a React frontend and an Express backend. It includes user authentication, email verification, password reset, and more.

For more detailed documentation, please refer to the [prd](./docs/prd.md).

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher) or yarn
- MongoDB

## Installation

1. Clone the repository:

```sh
git clone https://github.com/your-username/your-repo.git
cd your-repo
```

2. Install dependencies for both client and server:

```sh
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

3. Create environment variable files:

```sh
# Server environment variables
cd ../server
cp .env.example .env

# Client environment variables
cd ../client
cp .env.example .env
```

4. Update the .env files with your configuration.

5. Start MongoDB:

```sh
sudo systemctl start mongod
sudo systemctl enable mongod
```

## Running the Project

1. Start the backend server:

```sh
cd server
npm run dev
```

2. Start the frontend client:

```sh
cd client
npm start
```

## Push to prod

1. Update server/.env

```sh
env=production
```

2. Start the app from server

```bash
npm run dev
```

Your app is accessible at `http://localhost:500` and the api ar `http://localhost:5000/api`
