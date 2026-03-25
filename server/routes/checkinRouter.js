const { Router } = require("express");
const checkinRouter = Router();

checkinRouter.post("/", async (req, res) => {
    const prisma = req.app.locals.prisma;
    const { habitId, completedDate } = req.body;
    if (!habitId || isNaN(habitId)) {
        return res.status(400).json({ message: "Bad index request" });
    }
    if (!completedDate) {
        return res.status(400).json({ message: "Date cannot be found" });
    }
    try {
       // Verify habit belongs to this user before creating checkin
        const habit = await prisma.habit.findUnique({
            where: {
                id: parseInt(habitId),
                userId: req.userId,
            }
        });
        if (!habit) return res.status(403).json({ message: "Unauthorized" });

        // Utilize UTC method consistently everywhere
        const date = new Date(completedDate);
        const normalizedDate = new Date(Date.UTC(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate(),
            12, 0, 0
        ));

        // Guard against future dates on the server level. 
        const todayDate = new Date();
        todayDate.setHours(23, 59, 59, 999); // End of day
        if (date > todayDate) {
            return res.status(400).json({ message: "Cannot create a check in for a future date" });
        }

        // Create a new checkIn for completed date.
        await prisma.checkIn.create({
            data: { 
                habitId: parseInt(habitId), 
                completedDate: normalizedDate,
            },
        });

        // Then fetch newly created checkin and return full habit with checkIns
        const updatedHabit = await prisma.habit.findUnique({
            where: { id: parseInt(habitId )},
            include: { checkIns: true },
        });
        res.status(201).json({ habit: updatedHabit });
    } catch (err) {
        res.status(500).json({ message: "Wasn't able to create Check in", error: err.message });
    }
});

checkinRouter.delete("/:id", async (req, res) => {
    const prisma = req.app.locals.prisma;
    const habitId = parseInt(req.params.id);
    if (!habitId) return res.status(400).json({ message: "Index does not exist" });
    try {
         // Verify checkin belongs to this user's habit before deleting
        const checkIn = await prisma.checkIn.findUnique({
            where: { id: habitId },
            include: { habit: true },
        });
        if (!checkIn || checkIn.habit.userId !== req.userId) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        // Remove today completed checkIn
        const removeCheckIn = await prisma.checkIn.delete({
            where: { id: habitId },
        });

        // Then fetch newly deleted checkin and return full habit without checkIns
        const updatedHabit = await prisma.habit.findUnique({
            where: { id: removeCheckIn.habitId },
            include: { checkIns: true },
        });
         res.status(200).json({ habit:updatedHabit });
    } catch (err) {
        res.status(500).json({message: "Wasn't able to delete checkin", error: err.message })
    }
});

module.exports = checkinRouter;