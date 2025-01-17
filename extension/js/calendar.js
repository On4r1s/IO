const API_URL = "http://127.0.0.1:5000";
language = "en"
const calendarLangDict = {
    pl: {
        title: "Kalendarz",
        add_meeting: "Dodaj spotkanie",
        date: "Data",
        start_time: "Godzina rozpoczęcia",
        end_time: "Godzina zakończenia",
        link: "Link",
        add_button: "Dodaj",
        no_meetings: "Brak spotkań na wybraną datę.",
        select_date: "Wybierz datę",
        delete: "Usuń",
        error_past_date: "Data musi być dzisiejsza lub przyszła.",
        error_time: "Godzina rozpoczęcia musi być wcześniejsza niż godzina zakończenia.",
        error_url: "Podaj poprawny URL.",
        prev: "Poprzedni",
        next: "Następny",
        month_names: [
            "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec", 
            "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"
        ],
        back: "Powrót",
        errors: "Błędy:",
    },
    en: {
        title: "Calendar",
        add_meeting: "Add Meeting",
        date: "Date",
        start_time: "Start Time",
        end_time: "End Time",
        link: "Link",
        add_button: "Add",
        no_meetings: "No meetings on the selected date.",
        select_date: "Select a date",
        delete: "Delete",
        error_past_date: "Date must be today or later.",
        error_time: "Start time must be earlier than end time.",
        error_url: "Please provide a valid URL.",
        prev: "Previous",
        next: "Next",
        month_names: [
            "January", "February", "March", "April", "May", "June", 
            "July", "August", "September", "October", "November", "December"
        ],
        back:"Back",
        errors: "Errors:"
    }
};


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
            meetingsList.innerHTML = `<p>${calendarLangDict[language].select_date}</p>`;
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
                <p id="meeting-date"><strong>${calendarLangDict[language].date}:</strong> ${meeting.date || "Brak danych"}</p>
                <p id="meeting-start-time"><strong>${calendarLangDict[language].start_time}:</strong> ${meeting.startTime || "Brak danych"}</p>
                <p id="meeting-end-time"><strong>${calendarLangDict[language].end_time}:</strong> ${meeting.endTime || "Brak danych"}</p>
                <p id="meeting-link">
                    <strong>${calendarLangDict[language].link}:</strong> 
                    ${meeting.link ? `<a href="${meeting.link}" target="_blank">${meeting.link}</a>` : "Brak linku"}
                </p>
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
                meetingsList.innerHTML = `<p>${calendarLangDict[language].no_meetings}</p>`;
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
        errors.push(calendarLangDict[language].error_past_date);
    }

    // Sprawdzenie czasu
    if (!startTime || !endTime || startTime >= endTime) {
        errors.push(calendarLangDict[language].error_time);
    }

    // Sprawdzenie URL
    try {
        new URL(link); // Spróbuje utworzyć URL - jeśli jest niepoprawny, wyrzuci wyjątek
    } catch (_) {
        errors.push("Podaj poprawny URL.");
    }

    // Wyświetlenie błędów (jeśli istnieją)
    if (errors.length > 0) {
        alert(`${calendarLangDict[language].errors} \n` + errors.join("\n"));
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
            chrome.runtime.sendMessage({ action: "monitorMeetings" }, (response) => {
            if (chrome.runtime.lastError) {
                console.error("Error sending message to background:", chrome.runtime.lastError);
            } else {
                console.log("monitorMeetings triggered:", response);
            }
});
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
        //console.log(data.message);
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
/*
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
*/
const months = calendarLangDict.en.month_names; // Default to English
const manipulate = () => {

    //console.log(calendarLangDict[language]?.month_names)
    localizedMonths = calendarLangDict[language]?.month_names || months;
    //console.log(localizedMonths)
    // Use localizedMonths in your calendar rendering logic
    //currdate.innerText = `${localizedMonths[month]} ${year}`;

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

    currdate.innerText = `${localizedMonths[month]} ${year}`;
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
document.getElementById('backButton').addEventListener('click', function() {
    chrome.tabs.update({
        url: chrome.runtime.getURL('html/main.html')
    })
});

// Fetch and apply the language dynamically
function updateCalendarLanguage(language) {
    const translations = calendarLangDict[language];

    // Update static text
    //document.querySelector(".calendar-current-date").textContent = translations.title;

    

    // Update form labels and buttons
    document.getElementById('dateText').textContent = calendarLangDict[language].date 
    document.getElementById('startTimeText').textContent = calendarLangDict[language].start_time
    document.getElementById('endTimeText').textContent = calendarLangDict[language].end_time 
    document.getElementById('linkText').textContent = calendarLangDict[language].link 
    
    document.getElementById('addMeetingH2').textContent = calendarLangDict[language].add_meeting
    document.getElementById('backButton').textContent = calendarLangDict[language].back
    console.log(calendarLangDict[language].month_names)
    // Update messages
    document.querySelector("#meetingsList").textContent = translations.no_meetings;
    //updateMeetingLabels(translations[language]);
}

// Fetch language from storage and initialize
chrome.storage.local.get("settings", (result) => {
    language = result.settings?.lang || "en"; // Default to English
    updateCalendarLanguage(language);
    manipulate(); // Refresh calendar to apply localized month names
});



// Wait for DOM to fully load
document.addEventListener("DOMContentLoaded", () => {
    // Fetch language setting and apply translations
    chrome.storage.local.get("settings", (result) => {
        language = result.settings?.lang || "en"; // Default to English
        //applyTranslations(language);
    });
});
//document.getElementById('dateLabel').textContent = "${calendarLangDict[language].date}:"


