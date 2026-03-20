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
    dialog = createForm(dialog);
    document.body.appendChild(dialog);
    
    return dialog;
}

function createForm(dialog) {
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