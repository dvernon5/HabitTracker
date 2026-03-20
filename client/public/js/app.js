/* ------------------------------------------------------------------------------------
 * FUNCTION NAME: createDialog
 * ------------------------------------------------------------------------------------
 * @brief Create a dialog form to collect user information
 *
 * This function makes a POST request to the server based on user form information.
 * Render the homepage with newly created habits before form submission
 * Safely reset the form and close the dialog before form submission
 * ------------------------------------------------------------------------------------
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
                <input type="text" id="name" name="name" require>
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
         //listHabits();    // future feature: Render the webpage with list of habits after submission.
    } catch(error) {
        const errorMessage = document.getElementById("error-message");
        errorMessage.textContent = "Unable to submit form. Please try again."
    } 
}

function enableAddHabitButton(submitBtn) {
    submitBtn.disabled = false;
}

function resetForm(form) {
    form.reset();  
}

function closeDialog() {
    dialog.close();
}

function cancelFormButton(cancelBtn) {
    cancelBtn.addEventListener('click', () => {
        dialog.close();
    });
}