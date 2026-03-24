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
app.use(express.static("client/public"));

const habitRouter = require("./routes/habitRouter");
const checkinRouter = require("./routes/checkinRouter");
app.use("/habits", habitRouter);
app.use("/checkins", checkinRouter);

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Now listening on http://localhost:${ PORT }`);
});