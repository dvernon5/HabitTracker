const { Router } = require("express");
const authRouter = Router();

// Landing page - no auth required.
authRouter.get("/", (req, res) => {
    res.sendFile("pages/index.html", {root: "../client/public" });
});