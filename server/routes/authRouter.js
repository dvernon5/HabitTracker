const express = require("express");
const authRouter = express.Router();
const { requireAuth } = require("express-openid-connect");

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