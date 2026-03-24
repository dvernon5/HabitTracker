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
                redirect_uri: `${ process.env.BASE_URL }/callback`,
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
            redirectUri: `${ process.env.BASE_URL }/callback`,
        });
    } catch (err) {
        res.status(500).json({ message: "Authentication failed", error: err.message });
    }
});

// Verifying token in a hidden form via callback. Create session if token is found.
authRouter.post("/callback", express.urlencoded({ extended: false }), async (req, res) => {
    try {
        await res.oidc.callback({
            redirectUri: `${ process.env.BASE_URL }/callback`,
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

module.exports = authRouter;