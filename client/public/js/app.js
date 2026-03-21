/**
 * @brief Update Homepage with updated information.
 *
 * This function fetches a list of habits from the database.
 * Renders homepage with habit details.
 * Creates a toggle button to mark each habit as complete or incomplete.
 * Creates a button to remove a selected habit.
 */
let lastHabitCard = 3; // Default to 3 on first load
async function listHabits() {
    const container = document.getElementById("habit-container");
    
    // Generate skeleton cards based on last know count.
    container.innerHTML = createSkeletonCard().repeat(lastHabitCard);
    const habits = await fetchHabits();
    if (!habits) return; // Stop execution if fetch failed

    // Update skeleton count for next page load.
    lastHabitCard = habits.length || 3;

    // Clear any previous error message and cards
    document.getElementById("error-message").textContent = '';
    container.innerHTML = '';

    // If no habit exist let the user know
    if (habits.length === 0) {
        container.innerHTML = '<p class="empty-state">No Habits yet. Add one above!</p>';
        return;
    }

    createHabitCards(habits, container);
}

function createSkeletonCard() {
    return `
        <div class="skeleton-card">
            <h3 class="skeleton skeleton-title"></h3>
            <p class="skeleton skeleton-text"></p>
            <p class="skeleton skeleton-text"></p>
            <button class="skeleton skeleton-btn"></button>
            <button class="skeleton skeleton-btn"></button>
        </div>
    `;
}

/**
 * @brief fetch all habits from the database
 *
 * Make a GET request to retrieve all habits for the current user.
 * 
 * @return (Array) Array of habit objects or undefined if fetch failed.
 */

async function fetchHabits() {
    try {
        const response = await fetch("/habits");
        if (!response.ok) throw Error("Bad request to fetch habits");
        const habits = await response.json();
        console.log(habits);
        return habits;
    } catch (error) {
        const errorMessage = document.getElementById("error-message");
        errorMessage.textContent = error.message;
    }
}

function createHabitCards(habits, container) {
    habits.forEach(habit => {
        const todayCheckIn = habit.checkIns.find(checkin => {
            const todayDate = new Date()
            todayDate.setHours(0, 0, 0, 0)

            const completedDate = new Date(checkin.completedDate)
            completedDate.setHours(0, 0, 0, 0);

            // If condition is true habit that already been completed.
            // Otherwise habit hasn't been completed yet. 
            return completedDate.toDateString() === todayDate.toDateString();
        });
        const habitCard = document.createElement("div");
        habitCard.addClassList.add("habit-card");
        habitCard.setAttribute("data-id", habit.id);
        habitCard.innerHTML = `
            <h3>${ habit.name }</h3>
            <p>Streak: ${ habit.streak }</p>
            <p>Longest Streak: ${ habit.longestStreak }</p>
            <div class="card-btn-control">
                <button class="toggle-checkin"
                        data-id="${ habit.id }"
                        data-checkin-id="${ todayCheckIn ? todayCheckIn.id : '' }">
                    ${ todayCheckIn ? "Checked In" : "Done Today" }
                </button>
                <button class="remove-btn" data-id="${ habit.id }">Remove Habit</button>
            </div>
        `;
        container.appendChild(habitCard);
    });
}

/**
 * @brief Creates a dialog form to collect habit information from the user.
 *
 * Builds and appends a dialog element to the DOM.
 * Attaches form submission and cancel event listeners.
 *
 * @returns {HTMLDialogElement} The created dialog element
 */
async function createDialog() {
    let dialog = document.createElement('dialog');
    dialog.setAttribute("id", "habit-dialog");
    dialog = buildForm(dialog);
    document.body.appendChild(dialog);

    const form = document.getElementById("habit-form");
    attachFormSubmitListener(form, dialog);

    const cancelBtn = document.querySelector('.cancel-btn');
    cancelBtn.addEventListener("click", () => {
        dialog.close();
    });
    
    return dialog;
}

function buildForm(dialog) {
    dialog.innerHTML = `
        <form id="habit-form" method="dialog">
            <label for="name">
                Habit Name:
                <input type="text" id="name" name="name" required>
            </label>
            <div class="form-button-control">
                <button type="submit">Add Habit</button>
                <button class="cancel-btn" type="button">Cancel</button>
            </div> 
        </form>
    `;

    return dialog;
}

function attachFormSubmitListener(form, dialog) {
    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = "Adding...";

        const name = document.getElementById("name").value.trim();
        await createHabit(name, submitBtn, originalText);

        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    });
}

async function createHabit(name, form, dialog) {
    try {
        // Make a POST request to store data in the database.
        const response = await fetch("/habits", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: name }),
        });

        // Check if Server Status Response is a success.
        if (!response.ok) throw Error("Bad request to create habit");

        // Status code was a success. Recieved JSON data.
        const habitData = await response.json();
        console.log(habitData);
        form.reset();
        dialog.close();
        listHabits();    // future feature: Render the webpage with list of habits after submission.
    } catch(error) {
        const errorMessage = document.getElementById("error-message");
        errorMessage.textContent = error.message;
    } 
}

// Initialize New Habit button and attach click event to open dialog
const newHabitBtn = document.querySelector(".trigger-modal");
let dialog = null;
newHabitBtn.addEventListener("click", async () => {
    if (!dialog) {
        dialog = await createDialog();
    }
    dialog.showModal();
});




