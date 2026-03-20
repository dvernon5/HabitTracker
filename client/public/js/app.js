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
    dialog.setAttribute("id", "habitDialog");
    dialog = buildForm(dialog);
    document.body.appendChild(dialog);
    const form = document.getElementById("habitForm");
    submitForm(form);
    const cancelBtn = document.querySelector('.cancel-btn');
    cancelFormButton(cancelBtn);
    
    return dialog;
}

function buildForm(dialog) {
    dialog.innerHTML = `
        <form id="habitForm" method="dialog">
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

function submitForm(form) {
    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        disableAddHabitButton(submitBtn);
        const name = getHabitName(); // Trim removes all leading and trailing whitespaces
        await createHabit(name, submitBtn, originalText);
        resetForm(form);
        closeDialog();
    });
}

function disableAddHabitButton(submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Adding..."

    return submitBtn;
}

function getHabitName() {
    return document.getElementById("name").value.trim();
}

async function createHabit(name, submitBtn, originalText) {
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
    } catch(error) {
        console.error("Cannot create request", error.message);
    } finally {
        enableAddHabitButton(submitBtn);
        submitBtn.textContent = originalText;
    }

    //listHabits();    // future feature: Render the webpage with list of habits after submission.
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