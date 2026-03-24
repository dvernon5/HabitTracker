require('dotenv').config();
const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { auth } = require('express-openid-connect');

const app = express();
const prisma = new PrismaClient();

// Make prisma accessible across all route files
app.locals.prisma = prisma;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("../client/public"));

// Auth0 configuration
const authConfig = {
    authRequired: false,    // Not every page requires login
    auth0Logout: true,      // Use Auth0 logout endpoint
    secret: process.env.SECRET,
    baseURL: process.env.BASE_URL,
    clientID: process.env.CLIENT_ID,
    issuerBaseURL: process.env.ISSUER_BASE_URL,
    clientSecret: process.env.CLIENT_SECRET,  // Required for code flow
    authorizationParams: {
        response_type: "code",  // Client is expecting to recieve an authorization code
    },
    routes: {
        login: false,     // Override default login route
        callback: false,  // Override default callback route  
        postLogoutRedirect: '/',
    }
};

// Apply the auth middleware.
app.use(auth(authConfig));

// Attach userId to every request
app.use((req, res, next) => {
    if (req.oidc.isAuthenticated()) {
        req.userId = req.oidc.user.sub;
    }
    next();
});

// Protect all /habits and /checkins routes
// User need to have authorization access/rights in order to use services.
app.use(["/habits", "/checkins"], (req, res, next) => {
    if (!req.userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    next();
});

const habitRouter = require("./routes/habitRouter");
const checkinRouter = require("./routes/checkinRouter");
const authRouter = require("./routes/authRouter");
app.use("/", authRouter);
app.use("/habits", habitRouter);
app.use("/checkins", checkinRouter);


// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Now listening on http://localhost:${ PORT }`);
});