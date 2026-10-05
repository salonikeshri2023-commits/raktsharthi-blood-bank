(() => {
    "use strict";

    const forms = document.querySelectorAll(".needs-validation");

    Array.from(forms).forEach((form) => {
        form.addEventListener(
            "submit",
            (event) => {
                if (!form.checkValidity()) {
                    event.preventDefault();
                    event.stopPropagation();
                }

                form.classList.add("was-validated");
            },
            false
        );
    });
})();



    const needBloodSwitch = document.getElementById("needBloodSwitch");
    const bloodRequestDiv = document.getElementById("bloodRequestDiv");

    if (needBloodSwitch && bloodRequestDiv) {
        const upper = document.getElementById("upper");
        const urgentStatusMessage = document.getElementById("urgentStatusMessage");
        const updateBloodRequestVisibility = () => {
            bloodRequestDiv.style.display = needBloodSwitch.checked ? "block" : "none";
            if (upper) {
                upper.style.display = needBloodSwitch.checked ? "none" : "";
            }
        };

        needBloodSwitch.addEventListener("change", async () => {
            const urgentBloodNeeded = needBloodSwitch.checked;
            needBloodSwitch.disabled = true;

            try {
                const response = await fetch(needBloodSwitch.dataset.url, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
                    },
                    body: new URLSearchParams({ urgentBloodNeeded: String(urgentBloodNeeded) })
                });
                if (!response.ok) {
                    throw new Error(`Request failed with status ${response.status}`);
                }

                const result = await response.json();
                needBloodSwitch.checked = result.urgentBloodNeeded;
                updateBloodRequestVisibility();
                urgentStatusMessage.textContent = result.urgentBloodNeeded
                    ? `Urgent request sent to ${result.notificationsSent} other hospital${result.notificationsSent === 1 ? "" : "s"}.`
                    : "Urgent request withdrawn.";
            } catch (error) {
                needBloodSwitch.checked = !urgentBloodNeeded;
                updateBloodRequestVisibility();
                urgentStatusMessage.textContent = "Could not update urgent blood status. Please try again.";
                console.error("Failed to update urgent blood status:", error);
            } finally {
                needBloodSwitch.disabled = false;
            }
        });

        updateBloodRequestVisibility();
    }

    const bloodInputs = document.querySelectorAll(".blood-input");
    const totalBloodStock = document.getElementById("totalBloodStock");

    function calculateTotal() {
        if (!totalBloodStock) {
            return;
        }
        let total = 0;

        bloodInputs.forEach(input => {
            total += Number(input.value) || 0;
        });

        totalBloodStock.textContent = total;
    }

    bloodInputs.forEach(input => {
        input.addEventListener("input", calculateTotal);
    });

    // Calculate total when page loads
    calculateTotal();



    const input = document.querySelector("#searchInput");
const cards = document.querySelectorAll(".listing-card");

if (input) {
    input.addEventListener("input", () => {

        let searchText = input.value.toLowerCase().trim();

        cards.forEach((card) => {

            const heading = card.querySelector(".heading");
            if (!heading) {
                return;
            }

            let title = heading.textContent.toLowerCase().trim();

            if (title.includes(searchText)) {
                card.style.display = "";
            } else {
                card.style.display = "none";
            }

        });

    });
}






