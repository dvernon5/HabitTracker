# Habit Tracker

A full stack habit tracking web application that allows users to build and maintain daily habits by tracking streaks and check-ins. Built with vanilla JavaScript, Express.js, Prisma ORM, and PostgreSQL, with Auth0 handling authentication and authorization.

## Live Demo

[https://habit-tracker-nthw.onrender.com](https://habit-tracker-nthw.onrender.com)

---

## Features

- User authentication and authorization via Auth0
- Multi-tenant architecture, each user only sees their own habits
- Create and remove habits
- Daily check-in toggle to mark habits as complete or incomplete
- Current streak and longest streak tracking
- Skeleton loading effect during data fetching
- Responsive grid layout that works on desktop and mobile
- Empty state messaging when no habits exist
- Button disable states during async operations to prevent duplicate requests

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | HTML, CSS, Vanilla JavaScript |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| ORM | Prisma |
| Authentication | Auth0 (express-openid-connect) |
| Deployment | Render |

---

## Project Structure

```
HabitTracker
    client
        public
            css
                home.css       <- landing page styles
                app.css        <- habit tracker styles
            js
                app.js         <- habit tracker client logic
            pages
                index.html     <- landing page
                app.html       <- habit tracker page
    server
        prisma
            migrations
            schema.prisma
        routes
            authRouter.js      <- authentication routes
            habitRouter.js     <- habit CRUD routes
            checkinRouter.js   <- check-in routes
        server.js
        package.json
    .gitignore
    README.md
```

---

## Database Schema

The application uses three models:

**User** stores the Auth0 user ID as the primary key. Created automatically on first login via Prisma upsert.

**Habit** stores habit name, current streak, longest streak, and a foreign key linking to the User model.

**CheckIn** stores a completed date and a foreign key linking to the Habit model. A unique constraint on `[habitId, completedDate]` prevents duplicate check-ins on the same day.

---

## Authentication and Authorization

Authentication is handled by Auth0 using the OpenID Connect protocol via the `express-openid-connect` package.

When a user visits the landing page and clicks login they are redirected to Auth0's Universal Login page. After successful authentication Auth0 redirects back to the application's `/callback` route where a session is created and the user is redirected to `/app`.

Authorization is enforced on every API route by verifying the authenticated user's ID (`req.oidc.user.sub`) against the `userId` field on each habit. This ensures users can only read and modify their own data.

On first login a User record is automatically created in the database using Prisma's `upsert` operation. Subsequent logins find the existing record and proceed without creating duplicates.

---

## API Routes

### Authentication
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/` | Landing page |
| GET | `/login` | Redirects to Auth0 login |
| GET | `/callback` | Handles Auth0 callback via URL |
| POST | `/callback` | Handles Auth0 callback via form post |
| GET | `/app` | Habit tracker page (auth required) |
| GET | `/logout` | Logs user out and redirects to landing page |

### Habits
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/habits` | Get all habits for authenticated user |
| GET | `/habits/:id` | Get a specific habit with check-ins |
| POST | `/habits` | Create a new habit |
| PUT | `/habits/:id` | Update streak and longest streak |
| DELETE | `/habits/:id` | Delete a habit |

### Check-ins
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/checkins` | Create a check-in for today |
| DELETE | `/checkins/:id` | Delete a check-in |

---

## Streak Algorithm

The streak is calculated by walking backwards from today's date through the check-in history counting consecutive completed days. The algorithm stops counting as soon as a gap is found.

All dates are stored and compared in UTC to ensure consistent behavior regardless of the user's timezone or the server's location.

The longest streak is a permanent record that only increases. It never decreases when a user unchecks a habit.

---

## Running Locally

**Prerequisites:**
- Node.js
- A PostgreSQL database
- An Auth0 account

**Steps:**

1. Clone the repository:
```bash
git clone https://github.com/dvernon5/HabitTracker.git
cd HabitTracker/server
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the server folder:
```
DATABASE_URL=your_postgresql_connection_string
SECRET=your_auth0_secret
BASE_URL=http://localhost:3000
CLIENT_ID=your_auth0_client_id
ISSUER_BASE_URL=your_auth0_issuer_url
CLIENT_SECRET=your_auth0_client_secret
```

4. Run database migrations:
```bash
npx prisma migrate deploy
npx prisma generate
```

5. Start the server:
```bash
node server.js
```

6. Visit `http://localhost:3000`

---

## What I Learned

- Designing and implementing a RESTful API with Express.js
- Working with relational databases using Prisma ORM
- Implementing authentication and authorization using Auth0 and OpenID Connect
- Building a multi-tenant architecture where user data is fully isolated
- Handling timezone differences between client, server, and database
- Deploying a full stack application to Render with PostgreSQL
- Writing clean, documented JavaScript with JSDoc comments
- Managing async operations safely with try/catch/finally blocks