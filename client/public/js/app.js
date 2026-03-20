/**
 * @brief Update Homepage with updated information.
 *
 * This function fetches a list of habits from the database.
 * Render homepage with habits details.
 * Create a toggle button to mark each habits as complete or incomplete
 * Create a button to remove a selected habit.
 *
 * 
 */
let lastHabitCard = 3; // Default to 3 on first load
async function listHabits() {
    const container = document.getElementById("habit-container");
    
    // Generate skeleton cards based on last know count.
    container.innerHTML = createSkeletonCard.repeat(lastHabitCard);
}

function createSkeletonCard() {
    return `
        <div skeletonCard>
            <h3 class="skeleton skeleton-title"></h3>
            <p class="skeleton skeleton-text"></p>
            <p class="skeleton skeleton-text"></p>
            <button class="skeleton skeleton-btn">
            <button class="skeleton skeleton-btn"></button>
        </di>
    `
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
        errorMessage.textContent = "Unable to submit form. Please try again."
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




