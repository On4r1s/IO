const API_URL = "http://127.0.0.1:5000";

async function listMeetings(selectedDate) {
    try {
        const response = await fetch(`${API_URL}/meetings`);
        const meetings = await response.json();

        const meetingsList = document.getElementById("meetingsList");
        meetingsList.innerHTML = "";

        


        let filteredMeetings;

        if (selectedDate) { // Jeśli data została wybrana
            const selectedDateStr = selectedDate.toISOString().split('T')[0];
            filteredMeetings = meetings.filter(meeting => {
                const meetingDate = new Date(meeting.date);
                return (
                    meetingDate.getFullYear() === selectedDate.getFullYear() &&
                    meetingDate.getMonth() === selectedDate.getMonth() &&
                    meetingDate.getDate() === selectedDate.getDate()
                );
            });
        } else {
            meetingsList.innerHTML = `<p>Wybierz datę</p>`;
            filteredMeetings = [];
        }

        if (filteredMeetings.length > 0) {
            filteredMeetings.forEach(meeting => {
                // Główna kontenerka spotkania
                const meetingItem = document.createElement("div");
                meetingItem.className = "meeting-item";

                // Informacje o spotkaniu
                const meetingInfo = document.createElement("div");
                meetingInfo.className = "meeting-info";
                meetingInfo.innerHTML = `
                    <p><strong>Data:</strong> ${meeting.date || "Brak danych"}</p>
                    <p><strong>Godzina rozpoczęcia:</strong> ${meeting.startTime || "Brak danych"}</p>
                    <p><strong>Godzina zakończenia:</strong> ${meeting.endTime || "Brak danych"}</p>
                    <p><strong>Link:</strong> <a href="${meeting.link}" target="_blank">${meeting.link || "Brak linku"}</a></p>
                `;

                // Przycisk "Usuń"
                const deleteButton = document.createElement("button");
                deleteButton.className = "delete-button";
                deleteButton.textContent = "Usuń";
                deleteButton.setAttribute("data-index", meeting.id); // Przyjmuję, że meeting.id jest identyfikatorem spotkania
                deleteButton.addEventListener("click", () => {
                    deleteMeeting(meeting.id); // Wywołanie funkcji usuwania
                });

                // Dodanie informacji i przycisku do głównego kontenera
                meetingItem.appendChild(meetingInfo);
                meetingItem.appendChild(deleteButton);

                // Dodanie elementu spotkania do listy
                meetingsList.appendChild(meetingItem);
            });
        } else {
            if (selectedDate){
                meetingsList.innerHTML = `<p>Brak spotkań na wybraną datę.</p>`;
            }
        }
    } catch (error) {
        console.error("Błąd:", error);
    }
}




document.getElementById("addMeetingForm").addEventListener("submit", event => {
    event.preventDefault(); // Zapobiega przeładowaniu strony

    const date = document.getElementById("date").value;
    const startTime = document.getElementById("startTime").value;
    const endTime = document.getElementById("endTime").value;
    const link = document.getElementById("link").value;
    const errors = [];

    // Sprawdzenie, czy data jest poprawna
    if (!date || new Date(date) < new Date().setHours(0, 0, 0, 0)) {
        errors.push("Data musi być dzisiejsza lub przyszła.");
    }

    // Sprawdzenie czasu
    if (!startTime || !endTime || startTime >= endTime) {
        errors.push("Godzina rozpoczęcia musi być wcześniejsza niż godzina zakończenia.");
    }

    // Sprawdzenie URL
    try {
        new URL(link); // Spróbuje utworzyć URL - jeśli jest niepoprawny, wyrzuci wyjątek
    } catch (_) {
        errors.push("Podaj poprawny URL.");
    }

    // Wyświetlenie błędów (jeśli istnieją)
    if (errors.length > 0) {
        alert("Błędy:\n" + errors.join("\n"));
        return;
    }
    const newMeeting = { date, startTime, endTime, link };


    fetch(`${API_URL}/add-meeting`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"  // Nagłówek informuje o JSON
        },
        body: JSON.stringify(newMeeting)  // Przekaż dane w formacie JSON
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Błąd HTTP! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Spotkanie dodane:", data.message);
            listMeetings(selectedDate); // Odśwież listę spotkań dla wybranej daty
            manipulate(); // Odśwież kalendarz
        })
        .catch(error => console.error("Błąd podczas dodawania spotkania:", error));
});
// Usuwanie spotkania
async function deleteMeeting(meetingId) {
    try {
        const response = await fetch(`${API_URL}/delete-meeting/${meetingId}`, {
            method: "DELETE"
        });

        const data = await response.json();
        console.log(data.message);
        await listMeetings(selectedDate); // Odśwież listę
    } catch (error) {
        console.error("Błąd podczas usuwania spotkania:", error);
    }
}


document.addEventListener("DOMContentLoaded", () => {
  listMeetings();
});

let date = new Date();
let year = date.getFullYear();
let month = date.getMonth();
let selectedDate = null; // Przechowuje wybraną datę

const day = document.querySelector(".calendar-dates");
const currdate = document.querySelector(".calendar-current-date");
const prenexIcons = document.querySelectorAll(".calendar-navigation span");

// Tablica nazw miesięcy
const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
];
const manipulate = () => {
    let dayone = new Date(year, month, 1).getDay();
    let lastdate = new Date(year, month + 1, 0).getDate();
    let dayend = new Date(year, month, lastdate).getDay();
    let monthlastdate = new Date(year, month, 0).getDate();

    let lit = "";

    for (let i = dayone; i > 0; i--) {
        lit += `<li class="inactive">${monthlastdate - i + 1}</li>`;
    }

    for (let i = 1; i <= lastdate; i++) {
        let isToday = i === date.getDate() &&
            month === new Date().getMonth() &&
            year === new Date().getFullYear()
            ? "today"
            : "";

        let isSelected = selectedDate &&
            selectedDate.getDate() === i &&
            selectedDate.getMonth() === month &&
            selectedDate.getFullYear() === year
            ? "active"
            : "";

        lit += `<li class="${isToday} ${isSelected}" data-day="${i}">${i}</li>`;
    }

    for (let i = dayend; i < 6; i++) {
        lit += `<li class="inactive">${i - dayend + 1}</li>`;
    }

    currdate.innerText = `${months[month]} ${year}`;
    day.innerHTML = lit;

    const days = document.querySelectorAll(".calendar-dates li:not(.inactive)");
    days.forEach(dayItem => {
        dayItem.addEventListener("click", () => {
            const clickedDay = parseInt(dayItem.getAttribute("data-day"), 10);
            selectedDate = new Date(year, month, clickedDay);
        
            console.log("Wybrana data (selectedDate):", selectedDate); // Dodaj to logowanie
        
            manipulate(); // Aktualizacja kalendarza
                listMeetings(selectedDate); // Wyświetlenie spotkań
        });
    });
};

prenexIcons.forEach(icon => {
    icon.addEventListener("click", () => {
        month = icon.id === "calendar-prev" ? month - 1 : month + 1;

        if (month < 0 || month > 11) {
            date = new Date(year, month, new Date().getDate());
            year = date.getFullYear();
            month = date.getMonth();
        } else {
            date = new Date();
        }

        manipulate();
    });
});


manipulate();


// Attach a click event listener to each icon
prenexIcons.forEach(icon => {

    // When an icon is clicked
    icon.addEventListener("click", () => {

        // Check if the icon is "calendar-prev"
        // or "calendar-next"
        //month = icon.id === "calendar-prev" ? month  : month ;
        // moja ulubiona linijka kodu ever nigdy nic lepszego już nie napiszę

        // Check if the month is out of range
        if (month < 0 || month > 11) {

            // Set the date to the first day of the 
            // month with the new year
            date = new Date(year, month, new Date().getDate());

            // Set the year to the new year
            year = date.getFullYear();

            // Set the month to the new month
            month = date.getMonth();
        }

        else {

            // Set the date to the current date
            date = new Date();
        }

        // Call the manipulate function to 
        // update the calendar display
        manipulate();
    });
});