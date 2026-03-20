const express = require("express");
const app = express();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const habitRouter = require("./routes/habitRouter");

// Make prisma accessible across all route files
app.locals.prisma = prisma;

app.use(express.json);
app.use(express.urlencoded({ extended: true }));

app.use("/habits", habitRouter);