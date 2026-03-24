const express = require("express");
const authRouter = express.Router();
const { requiresAuth } = require("express-openid-connect");

// Landing page - no auth required.
authRouter.get("/", (req, res) => {
    res.sendFile("pages/index.html", {root: "../client/public" });
});

// Custom login route
authRouter.get("/login", async (req, res) => {
    try {
        res.oidc.login({
            returnTo: '/app',
            authorizationParams: {
                redirect_uri: 'http://localhost:3000/callback',
            },
        });
    } catch(err) {
        res.status(500).json({ message: "Login failed", error: err.message });
    }
});

// Verifying token in the URL via callback. Create session if token is found.
authRouter.get("/callback", async (req, res) => {
    try {
        await res.oidc.callback({
            redirectUri: "http://localhost:3000/callback",
        });
    } catch (err) {
        res.status(500).json({ message: "Authentication failed", error: err.message });
    }
});

// Verifying token in a hidden form via callback. Create session if token is found.
authRouter.post("/callback", express.urlencoded({ extended: false }), async (req, res) => {
    try {
        await res.oidc.callback({
            redirectUri: 'http://localhost:3000/callback',
        });
    } catch(err) {
        res.status(500).json({ message: "Authentication failed", error: err.message });
    }
});

// Habit Tracker page - auth required.
authRouter.get("/app", requiresAuth(), async (req, res) => {
    const prisma = req.app.locals.prisma;
    try {
        // Create user if they don't exist yet
        await prisma.user.upsert({
            where: { id: req.userId },
            update: {},
            create: { id: req.userId },
        });
        res.sendFile("pages/app.html", { root: "../client/public" });
    } catch(err) {
        res.status(500).json({ message: "Unable to create user session" });
    }
});

// Logout route
authRouter.get("/logout", async (req, res) => {
    try {
        res.oidc.logout({ returnTo: process.env.BASE_URL });
    } catch (err) {
        res.status(500).json({ message: "Logout failed", error: err.message });
    }
});

authRouter.get("/profile", async (req, res) => {
   const user = req.oidc.user;

    res.send(`
    <html>
      <head>
        <title>Profile - Auth0 Express</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 2rem; max-width: 600px; margin: 0 auto; }
          a { color: #0066cc; text-decoration: none; }
          img { border-radius: 50%; }
          pre { background: #f4f4f4; padding: 1rem; border-radius: 4px; overflow-x: auto; }
          .card { border: 1px solid #ddd; border-radius: 8px; padding: 1.5rem; margin: 1rem 0; }
        </style>
      </head>
      <body>
        <h1>User Profile</h1>
        <div class="card">
          ${user.picture ? `<img src="${user.picture}" alt="Profile" width="80" />` : ''}
          <h2>${user.name || user.nickname || 'User'}</h2>
          <p><strong>Email:</strong> ${user.email || 'N/A'}</p>
        </div>
        <h3>Full User Object</h3>
        <pre>${JSON.stringify(user, null, 2)}</pre>
        <nav>
          <a href="/app">Habit Tracker</a> | <a href="/logout">Logout</a>
        </nav>
      </body>
    </html>
  `);
});

module.exports = authRouter;