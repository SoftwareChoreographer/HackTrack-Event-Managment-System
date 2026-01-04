# 🚀 HackTrack

A lightweight, developer-friendly web app for tracking hackathon events and attendee activity. HackTrack helps organizers create and manage event schedules, registrations, and quick on-site check-ins — designed to be simple to run locally and easy to extend.

---

## ✨ Features

- 🗓️ Event creation & schedule management  
- 🧾 Attendee registration and check-in flow  
- 📊 Basic attendance reporting and CSV exports  
- ⚡ Real-time check-in updates (when enabled)  
- 🔌 Modular JavaScript and Pug templates for easy extension  
- 🔒 Simple auth hooks ready for OAuth/SSO integration

---

## 🛠️ Prerequisites

- Node.js (LTS recommended — v14+)
- npm (or yarn)
- Git
- MySQL server (5.7+ or 8.x)

---

## 🛠️ Installation

1. Clone the repo
```bash
git clone https://github.com/SoftwareChoreographer/HackTrack-Events.git
cd HackTrack-Events
```

2. Install dependencies
```bash
npm install
```

3. Prepare MySQL
- Create a database and (optionally) a dedicated user:
```sql
CREATE DATABASE hacktrack;
CREATE USER 'hacktrack_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON hacktrack.* TO 'hacktrack_user'@'localhost';
FLUSH PRIVILEGES;
```
- Run any provided SQL or migration scripts to create tables (check ./db or project docs). If the project includes a migration command, run it (for example): `npm run migrate`.

4. Environment variables
- Copy the example environment file and edit the values (do not add the real password to the example file).
```bash
cp .env.example .env
```
- Below is the .env used for development/testing in this project (sensitive values replaced with placeholders). Replace placeholders with your actual secrets before starting the app:

```env
# Database connection (MySQL)
DB_HOST=hacktrack-the3host44-1af5.k.aivencloud.com
DB_PORT=20807
DB_USER=avnadmin
DB_PASSWORD=PLACEHOLDER

# Database name
DB_NAME=defaultdb

# Auth / JWT
JWT_SECRET=PLACEHOLDER
JWT_EXPIRES_IN=1h

# App
PORT=5000
FRONTEND_URL=http://localhost:3000
```

Important: never commit the real `.env` file to version control. Store secrets securely (environment variables, secret manager, or CI/CD vault).

5. Start the app (development)
```bash
npm run dev
```
Or start the production server:
```bash
npm start
```

---

## ▶️ Usage

- Open your browser at http://localhost:5000 (or the port set in .env).  
- From the dashboard you can:
  - Create or edit events and sessions
  - Register and manage attendees
  - Check in attendees at the event entrance
  - Export attendee lists as CSV

Useful commands
```bash
# Install dependencies
npm install

# Start development server (with auto-reload if configured)
npm run dev

# Start production server
npm start

# Run linting (if configured)
npm run lint

# Run tests (if any)
npm test
```

Customize views in `views/` (Pug templates) and static assets in `public/` or `assets/`.

---

## 🧰 Technologies Used

- JavaScript (ESNext)
- Node.js
- Express (typical pairing with Pug)
- Pug (templates)
- CSS
- MySQL
- npm & Git

---

## 🤝 Contributing

Contributions are welcome — this was a collaborative academic project and improvements are appreciated.

Suggested workflow:
1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-change`
3. Implement changes and run linters/tests locally
4. Open a Pull Request with a clear summary of your changes

Please open issues for bugs, feature requests, or documentation improvements. Include reproduction steps and relevant logs/screenshots when possible.

Guidelines
- Follow existing code style and patterns
- Keep commits focused and descriptive
- Don’t commit secrets (.env) or database passwords

---

## 📝 Reporting Issues

When opening an issue, include:
- Short summary
- Steps to reproduce
- Expected vs actual behavior
- Any logs, stack traces, or screenshots

---

## 📄 License

MIT License — see the LICENSE file for details.

---
