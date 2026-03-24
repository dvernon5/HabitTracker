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
    attachToggleListener();
    attachRemoveListener();
}

/**
 * @brief Create skeleton loading cards.
 * 
 * Returns a skeleton card HTML string used as a loading placeholder
 * 
 * @returns { string } HTML string of skeleton card
 */
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

/**
 * @brief Create and render habit cards on the page.
 * 
 * Iterates through habits array and creates a card for each habit.
 * Checks if habit has been completed today to set toggle button state
 * 
 * @param { Array } habits - Array of habits objects from the database
 * @param { HTMLElement } container - The DOM element to append card to.
 */
function createHabitCards(habits, container) {
    habits.forEach(habit => {
        // Check if habit has been completed today.
        const todayCheckIn = habit.checkIns.find(checkin => {
            const todayDate = new Date()
            todayDate.setHours(0, 0, 0, 0)

            const completedDate = new Date(checkin.completedDate)
            completedDate.setHours(0, 0, 0, 0);

            // If condition is true habit already been completed.
            // Otherwise habit hasn't been completed yet. 
            return completedDate.toDateString() === todayDate.toDateString();
        });
        const habitCard = document.createElement("div");
        habitCard.classList.add("habit-card");
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
 * @brief Attach an event listener to all toggle buttons.
 */
function attachToggleListener() {
    const toggleBtn = document.querySelectorAll(".toggle-checkin");
    toggleBtn.forEach(btn => {
        btn.addEventListener("click", (event) => {
            const habitId = event.target.dataset.id;
            const checkinId = event.target.dataset.checkinId;
            toggleCheckIn(checkinId, habitId);
        });
    });
}

/**
 * @brief Attach an event listener to all remove buttons.
 */
function attachRemoveListener() {
    const removeBtn = document.querySelectorAll(".remove-btn");
    removeBtn.forEach(btn => {
        btn.addEventListener("click", event => {
            removeHabit(event.target.dataset.id);
        });
    });
}

/**
 * @brief Change the completion state of habit for today
 * 
 * Checks if a check-in exists for today.
 * If no check-in exists make a POST request to create one.
 * If a check-in exists make a DELETE request to remove it.
 * Recalculates streak after each toggle action.
 * 
 * @param {*} checkInId - The ID of today's check-in if it exists.
 * @param {*} habitId - The ID of the habit being toggled.
 */
async function toggleCheckIn(checkInId, habitId) {
    const toggleBtns = document.querySelectorAll(".toggle-checkin");
    const removeBtns = document.querySelectorAll(".remove-btn");
    const newHabitButton = document.querySelector(".trigger-modal");

    disableToggleButton(toggleBtns, habitId);
    disableRemoveButton(removeBtns);
    disableNewHabitButton(newHabitButton);

    let updatedHabitData = null;

    // Check to see if user is trying to create or delete a checkin
    let isDelete = false; 
    try {
        // checkInId does not exist, create an entry.
        if (!checkInId) {
            updatedHabitData = await createCheckin(habitId);
        } else {
            isDelete = true;
            updatedHabitData = await deleteCheckin(checkInId);
        }
    } catch (err) {
        const errorMessage = document.getElementById('error-message');
        errorMessage.textContent = "Unable to fulfill toggle request. Please try again.";
    } finally {
        enableToggleButton(toggleBtns);
        enableRemoveButton(removeBtns);
        enableNewHabitButton(newHabitButton);
    }
    console.log("Updated Habit Data = ", updatedHabitData);
    await incrementStreak(updatedHabitData, isDelete);

    // Re-render the habits list to reflect the toggle change.
    listHabits();
}

/**
 * @brief Makes a POST request to create a new check-in for today
 * 
 * Sends habitId and current date to the server to mark habit as complete.
 * Displays an error message if the request fails.
 * 
 * @param { string } habitId - The ID of the habit to check in.
 * @return { Object } Updated habit object containing id, name, streak
 *                    longestStreak, chechIns array.
 */
async function createCheckin(habitId) {
    try {
        const response = await fetch("/checkins", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
                habitId: parseInt(habitId),
                completedDate: new Date().toISOString()
            })
        });
        if (!response.ok) throw Error("Failed to check in completed habit");
        const checkinData = await response.json();
        console.log(checkinData);
        return checkinData;
    } catch (error) {
        const errorMessage = document.getElementById('error-message');
        errorMessage.textContent = "Unable to create check in. Please try again";
    }
}

/**
 * @brief Makes a DELETE request to remove an existing check-in
 * 
 * Removes today's check-in to mark habit as incomplete.
 * Displays an error message if the request fails.
 * 
 * @param { string } checkinId - The ID of the check-in to delete
 * @return { Object } Updated habit object containing id, name, streak
 *                    longestStreak, chechIns array. 
 */
async function deleteCheckin(checkinId) {
    try {
        const response = await fetch(`/checkins/${ checkinId }`, { 
            method: "DELETE" 
        });
        if (!response.ok) throw Error("Bad request to delete latest checkin");
        const deletedData = await response.json();
        console(deletedData);
        return deletedData;
    } catch(err) {
        const errorMessage = document.getElementById("error-message");
        errorMessage.textContent = "Unable to delete latest checkin";
    }
}

/**
 * @brief Orchestrates the streak update process after a toggle action.
 * 
 * Retrieves the habit object from the updated response.
 * Calculates the new streak using calculateStreak.
 * Sends the updated streak values to the server via makeStreakPutRequest.
 * Displays an error message if the process fails.
 * 
 * @param { Object } updatedHabitData - The response object containing the updated habit.
 * @param { boolean } isDeleted - Flag indicating if the toggle was a deletion.
 *                                True means start streak calculation from yesterday.
 *                                False means start from today.
 */
async function incrementStreak(updatedHabitData, isDelete = false) {
    console.log("Calling increment streak");
    try {
         // Get access to the habit object and properties
        const habit = updatedHabitData.habit;
        const { streak, longestStreak } = calculateStreak(habit, isDelete);
        await makeStreakPutRequest(habit.id, streak, longestStreak);
    } catch (err) {
        const errorMessage = document.getElementById('error-message');
        errorMessage.textContent = "Unable to calculate streak. Please try again.";
    }
}

/**
 * @brief Calculates the current streak and longest streak for a habit.
 * 
 * Converts all check-in dates to date strings for comparison.
 * Walks backwards from today counting consecutive completed days.
 * Stops counting when a gap in consecutive dates is found.
 * Only updates longestStreak if current streak exceeds it.
 * longestStreak never decreases - it is a permanent record.
 * 
 * @param { Object } habit - The habit object containing checkIns array,
 *                           streak, and longestStreak.
 * @param { boolean } startFromYesterday - If true starts calculation for yesterday
 *                                         instead of today. Used when unchecking a habit.
 * @returns { Object } Object containing:
 *                     - streak { number } The current consective streak.
 *                     - longestStreak { number } The longest streak ever achieved.
 */
function calculateStreak(habit, startFromYesterday = false) {
    // If checkIn is empty there's no date to calculate.
    if (habit.checkIns.length === 0) {
        return { streak: 0, longestStreak: habit.longestStreak };
    }

    // Convert all check-in entries to a new Array.
    const completedDates = habit.checkIns.map(checkin => {
        return new Date(checkin.completedDate).toDateString();
    });

    let todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    // If unchecking, start from Yesterday
    if (startFromYesterday) {
        todayDate.setDate(todayDate.getDate() - 1);
    }

    let streak = 0;

    // Starting from today date work backward to calculate the streak.
    while (true) {
        const dateString = todayDate.toDateString();
        if (completedDates.includes(dateString)) {
            streak++;
            todayDate.setDate(todayDate.getDate() - 1);  // Get the previous day.
        } else { 
            break;
        }
    }
    const longestStreak = streak > habit.longestStreak ? streak : habit.longestStreak;

    return { streak, longestStreak };
}

/**
 * @brief Makes a PUT request to update streak values in the datebase.
 * 
 * Sends both current streak and longest streak to the server.
 * Longest streak only updates when current streak exceeds previous record.
 * Displays an error message if the request fails.
 * @param { number } habitId - The ID of the habit to update.
 * @param { number } streak - The current consectutive streak value.
 * @param { number } longestStreak - The longest streak ever achieved
 */
async function makeStreakPutRequest(habitId, streak, longestStreak) {
    try {
         const response = await fetch(`/habits/${ habitId }`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                streak: streak,
                longestStreak: longestStreak,
            })
        });
        if (!response.ok) throw Error("Bad request to update streak.");
        const updatedStreak = await response.json();
        console.log(updatedStreak);
    } catch(err) {
        const errorMessage = document.getElementById('error-message');
        errorMessage.textContent = "Unable to update streak request.";
    }
}

/**
 * @brief Makes a DELETE request to remove a habit from the database.
 * 
 * Disables all interactive buttons during the deletion process
 * to prevent duplicate or conflicting requests.
 * Re-renders the habit list after successful deletion.
 * Displays an error message if the request fails.
 * 
 * @param { string } habitId  - The ID of the habit to delete
 */
async function removeHabit(habitId) {
    const toggleBtns = document.querySelectorAll(".toggle-checkin");
    const removeBtns = document.querySelectorAll(".remove-btn");
    const newHabitButton = document.querySelector(".trigger-modal");

    disableToggleButton(toggleBtns, null);
    disableRemoveButton(removeBtns);
    disableNewHabitButton(newHabitButton);

    try {
        const response = await fetch(`/habits/${ habitId }`, {
            method: "DELETE",
        });
        if (!response.ok) throw Error("Bad request to delete habit");
        const deletedHabit = await response.json();
        console.log(deletedHabit);
        listHabits();
    } catch (err) {
        document.getElementById('error-message').textContent = "Unable to delete habit. Please try again.";
    } finally {
        enableToggleButton(toggleBtns);
        enableRemoveButton(removeBtns);
        enableNewHabitButton(newHabitButton);
    }
}

/**
 * @brief - Disable all toggle buttons during an async operation.
 * 
 * Shows "Saving..." only on the active button.
 * Stores original text for restoration after operation completes.
 * 
 * @param { NodeList } toggleBtns - All toggle buttons on the page
 * @param { string } activeHabitId  - The ID of the habit being toggled.
 */
function disableToggleButton(toggleBtns, activeHabitId) {
    toggleBtns.forEach(btn => {
        btn.disabled = true;
        btn.dataset.originalText = btn.textContent;

        // Only changed the text value of the button that been clicked.
        if (btn.dataset.id === activeHabitId) {
            btn.textContent = "Saving...";
        }
    });
}

/**
 * @brief Re-enables all toggle buttons after an async operation.
 * 
 * Restores original button text for each button.
 * 
 * @param { NodeList } toogleBtns - All toggle button on the page.
 */
function enableToggleButton(toogleBtns) {
    toogleBtns.forEach(btn => {
        btn.disabled = false;
        btn.textContent = btn.dataset.originalText;
    });
}

/**
 * @brief Disables all remove buttons during async operations
 * 
 * Prevent habit deletion while a toggle operation is in progress.
 * 
 * @param { NodeList } removeBtns - All remove buttons on the page. 
 */
function disableRemoveButton(removeBtns) {
    removeBtns.forEach(btn => {
        btn.disabled = true;
    });
}

/**
 * @brief Re-enables all remove buttons after an async operation.
 * 
 * @param { NodeList } removeBtns - All remove buttons on the page.
 */
function enableRemoveButton(removeBtns) {
    removeBtns.forEach(btn => {
        removeBtns.disabled = false;
    });
}

/**
 * @brief - Disable Add New Habit button during an async operation.
 * 
 * @param { ElementButton } newHabitButton - New Habit Button on app landing page.
 */
function disableNewHabitButton(newHabitButton) {
    newHabitButton.disabled = true;
}

/**
 * @brief - Enable Add New Habit button during an async operation.
 * 
 * @param { ElementButton } newHabitButton - New Habit Button on app landing page.
 */
function enableNewHabitButton(newHabitButton) {
    newHabitButton.disabled = false;
}

/**
 * @brief Creates a dialog form to collect habit information from the user.
 *
 * Builds and appends a dialog element to the DOM.
 * Attaches form submission and cancel event listeners.
 *
 * @returns { HTMLDialogElement } The created dialog element
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

/**
 * @brief Builds the inner HTML form structure for the dialog.
 * 
 * Injects a habit name input field and action buttons into the dialog.
 * 
 * @param { HTMLDialogElement } dialog - The dialong element to inject form into
 * @return { HTMLDialogElement } The dialog element with form injected.
 */
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

/**
 * @brief Attaches a submit event listener to the habit form.
 * 
 * Handles form submission by disabling the submit button during
 * the request to prevent duplicate submissions.
 * Calls createHabit to make the POST request to the server.
 * 
 * @param { HTMLFormElement } form - The form element to attach the listen to.
 * @param { HTMLDialogElement } dialog - The dialog element to close after submission 
 */
function attachFormSubmitListener(form, dialog) {
    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = "Adding...";

        const cancelBtn = form.querySelector(".cancel-btn");
        cancelBtn.disabled = true;

        const name = document.getElementById("name").value.trim();
        await createHabit(name, form, dialog);

        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        cancelBtn.disabled = false;
    });
}

/**
 * @brief Make a POST request to create a new habit in the database
 * 
 * Sends habit name to the server and resets the form on success.
 * Closes the dialog and re-renders the habit list after successful creation.
 * Displays an error message if the request fails.
 * 
 * @param { string } name - The name of the habit to create.
 * @param { HTMLFormElement } form - The form eleemnt to reset after submission.
 * @param { HTMLDialogElement } dialog - The dialog element to close after submission.
 */
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

// Load List onto Page
document.addEventListener("DOMContentLoaded", listHabits);