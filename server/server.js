const express = require("express");
const app = express();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const habitRouter = require("./routes/habitRouter");
const checkinRouter = require("./routes/checkinRouter");

// Make prisma accessible across all route files
app.locals.prisma = prisma;

app.use(express.json);
app.use(express.urlencoded({ extended: true }));

app.use("/habits", habitRouter);
app.use("/checkins", checkinRouter);