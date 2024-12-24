// main.js
// Function to update page content based on language
function updateLanguage(language) {
    const translations = {
        en: {
            calendarTitle: "Calendar",
            calendarText: "Click below to interact with the calendar.",
            openCalendar: "Open Calendar",
            manageRecordingsTitle: "Manage Recordings",
            manageRecordingsText: "Select options to manage your recordings.",
            loadRecordings: "Load Recordings",
            settingsTitle: "Settings",
            settingsText: "Configure your preferences below.",
            openSettings: "Open Settings"
        },
        pl: {
            calendarTitle: "Kalendarz",
            calendarText: "Kliknij poniżej, aby użyć kalendarza.",
            openCalendar: "Otwórz Kalendarz",
            manageRecordingsTitle: "Zarządzaj Nagrywaniami",
            manageRecordingsText: "Wybierz opcje, aby zarządzać nagraniami.",
            loadRecordings: "Załaduj Nagrania",
            settingsTitle: "Ustawienia",
            settingsText: "Skonfiguruj swoje preferencje poniżej.",
            openSettings: "Otwórz Ustawienia"
        }
    };

    // Apply translations to elements
    document.querySelector("#calendar-card h2").textContent = translations[language].calendarTitle;
    document.querySelector("#calendar-content p").textContent = translations[language].calendarText;
    document.querySelector("#calendar-btn").textContent = translations[language].openCalendar;

    document.querySelector("#record-card h2").textContent = translations[language].manageRecordingsTitle;
    document.querySelector("#record-content p").textContent = translations[language].manageRecordingsText;
    document.querySelector("#load-recordings-btn").textContent = translations[language].loadRecordings;

    document.querySelector("#settings-card h2").textContent = translations[language].settingsTitle;
    document.querySelector("#settings-content p").textContent = translations[language].settingsText;
    document.querySelector("#settings-btn").textContent = translations[language].openSettings;
}

// Load language setting from chrome.storage.local and update the page
chrome.storage.local.get("settings", (result) => {
    
    const language = result.settings?.lang || "en"; // Default to English if not set
    updateLanguage(language);
});

// Event listeners for navigation buttons
document.getElementById("calendar-btn").addEventListener("click", () => {
    chrome.tabs.update({
        url: chrome.runtime.getURL('html/calendar.html')
    });
});

document.getElementById("load-recordings-btn").addEventListener("click", () => {
    chrome.tabs.update({
        url: chrome.runtime.getURL('html/load-recordings.html')
    });
});

document.getElementById("settings-btn").addEventListener("click", () => {
    chrome.tabs.update({
        url: chrome.runtime.getURL('html/settings.html')
    });
});
