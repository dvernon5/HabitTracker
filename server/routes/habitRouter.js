const { Router } = require("express");
const habitRouter = Router();

habitRouter.get("/", async (req, res) => {
    try {
        const habits = await prisma.habit.findMany({
            include: { checkIns: true, },
        });
        res.status(200).json(habits);
    } catch (err) {
        res.status(500).json({ message: "No habits were found",  error: err.message  });
    }
});

habitRouter.post("/habits", async (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ message: "Please enter habit activity." });
    }
    try {
        const newHabits = await prisma.habit.create({
            data: { name: name },
        });
        res.status(201).json(newHabits);
    } catch (err) {
        res.status(500).json({ message: "Wasn't able to create habit", error: err.message });
    }
});

habitRouter.put("/habits/:id", async (req, res) => {
    const { streak, longestStreak } = req.body;
    if (streak === undefined || streak === null) { 
            return res.status(400).json({ message: "Streak is not found" }); 
    }
    if (longestStreak === undefined || longestStreak === null) {
        return res.status(400).json({ message: "Longest streak is not found" });
    }

    // Convert ID string into number
    const habitId = parseInt(req.params.id);
    if (!habitId) { 
        return res.status(400).json({ message: "habit Id was not found" }); 
    }
    try {
        const updateStreak = await prisma.habit.update({
            where: { id: habitId, },
            data: { 
                streak: streak, 
                longestStreak: longestStreak,
            },
        });
        res.status(200).json({ updateStreak });
    } catch(err) {
        res.status(500).json({ message: "Wasn't able to increment streak." });
    }
});

habitRouter.delete("/habits/:id", async (req, res) => {
    // Convert ID string into number
    const habitId = parseInt(req.params.id);
    if (!habitId) {
        return res.status(400).json({ message: "Index does not exist" });
    }
    try {
        const removeHabit = await prisma.habit.delete({
            where: { id: habitId },
        });
        res.status(200).json({ message: "Habit successfully deleted", habit: removeHabit });
    } catch (err) {
        res.status(500).json({ message: "Wasn't able to delete habit.", error: err.message });
    }
});

module.exports = habitRouter;