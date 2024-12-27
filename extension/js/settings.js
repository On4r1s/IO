const API_URL = "http://127.0.0.1:5000";

document.getElementById('backButton').addEventListener('click', function() {
    chrome.tabs.update({
        url: chrome.runtime.getURL('html/main.html')
    })
});


const settings = {
    language: "en", // Możliwe wartości: "en" (angielski), "pl" (polski)
    recordingQuality: 100, // Suwak teraz zwraca liczbę od 1 do 100
    maxDiskSpace: 10 // Maksymalna ilość miejsca na dysku w GB
};

const translations = {
    en: {
        languageLabel: "Language:",
        recordingQualityLabel: "Recording Quality:",
        maxDiskSpaceLabel: "Maximum Disk Space (GB):",
        saveButton: "Save Settings",
        diskSpaceInfoLabel: "Free Disk Space:",
        errorFetchingDiskSpace: "Failed to fetch disk space information.",
        en: "English",
        pl: "Polish",
        recordingQualityOptions: {
            low: "Low",
            medium: "Medium",
            high: "High"
        },
        errorSavingSettings: "Error saving settings:",
        settingSavedSuccesfully: "Setting Saved Succesfully"
    },
    pl: {
        languageLabel: "Język:",
        recordingQualityLabel: "Jakość nagrywania:",
        maxDiskSpaceLabel: "Maksymalne miejsce na dysku (GB):",
        saveButton: "Zapisz ustawienia",
        diskSpaceInfoLabel: "Wolne miejsce na dysku:",
        errorFetchingDiskSpace: "Nie udało się pobrać informacji o miejscu na dysku.",
        en: "Angielski",
        pl: "Polski",
        recordingQualityOptions: {
            low: "Niska",
            medium: "Średnia",
            high: "Wysoka"
        },
        errorSavingSettings: "Błąd podczas zapisywania ustawień:",
        settingSavedSuccesfully:"Ustawienia zapisane pomyślnie."
    }
};

// Funkcja aktualizująca UI na podstawie obiektu settings
function updateUI() {
    const lang = settings.language;

    // Aktualizuj etykiety na podstawie języka
    document.querySelector('label[for="language"]').textContent = translations[lang].languageLabel;
    document.querySelector('label[for="recordingQuality"]').textContent = translations[lang].recordingQualityLabel;
    document.querySelector('label[for="maxDiskSpace"]').textContent = translations[lang].maxDiskSpaceLabel;
    document.getElementById('saveButton').textContent = translations[lang].saveButton;

    // Aktualizuj etykietę dla informacji o miejscu na dysku
    console.log("Current language:", settings.language);
    document.getElementById('diskSpaceInfo').textContent = translations[lang].diskSpaceInfoLabel;
    
    // Aktualizuj wartości formularza
    document.getElementById('language').value = settings.language;
    document.getElementById('recordingQuality').value = settings.recordingQuality;
    document.getElementById('maxDiskSpace').value = settings.maxDiskSpace;

    // Zmień tłumaczenia opcji jakości nagrywania
    const qualitySelect = document.getElementById('recordingQuality');
    qualitySelect.innerHTML = '';
    Object.entries(translations[lang].recordingQualityOptions).forEach(([value, label]) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        if (value === settings.recordingQuality) {
            option.selected = true;
        }
        qualitySelect.appendChild(option);
    });
}

// Funkcja obsługująca błędy podczas pobierania miejsca na dysku
async function fetchDiskSpace() {
    try {
        const response = await fetch(`${API_URL}/disk-space`);
        if (!response.ok) {
            throw new Error("Disk space fetch failed");
        }
        const data = await response.json();
        document.getElementById('diskSpaceInfo').textContent = 
            `${translations[settings.language].diskSpaceInfoLabel} ${data.free} GB / ${data.total} GB`;
    } catch (error) {
        console.error("Error:", error);
        document.getElementById('diskSpaceInfo').textContent = 
            translations[settings.language].errorFetchingDiskSpace;
    }
}





function updateQualityLabel(value) {
    document.getElementById('qualityLabel').textContent = value;
    settings.recordingQuality = parseInt(value); // Aktualizuje bieżące ustawienia
}

async function saveSettings() {
    const settingsData = {
        max_space: settings.maxDiskSpace,
        quality: settings.recordingQuality,
        lang: settings.language
    };

    try {
        // Zapisz ustawienia na serwerze
        const response = await fetch(`${API_URL}/settings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(settingsData)
        });

        if (response.ok) {
            alert(`${translations[settings.language].settingSavedSuccesfully} `);

            // Zapisz ustawienia w chrome.storage.local
            chrome.storage.local.set({ settings: settingsData }, () => {
            
            });
            console.log(settingsData.lang)
            console.log(settingsData)
            changeRecordingLanguage(settingsData.lang)    

        } else {
            const text = await response.text();
            alert(`${translations[settings.language].errorSavingSettings} ${text}`);
        }
    } catch (error) {
        console.error((translations[settings.language].errorSavingSettings), error);
    }
    fetchDiskSpace();
    updateUI();
}

function changeRecordingLanguage(newLang) {

    chrome.storage.local.get(['recording_settings'], (result) => {
        let settings = result.recording_settings || {}; // Pobierz istniejące ustawienia lub stwórz pusty obiekt
        settings.lang = newLang; // Zmień język na nowy

        // Zapisz zmienione ustawienia z powrotem do storage
        chrome.storage.local.set({ recording_settings: settings }, () => {
            console.log(`Language changed to: ${newLang}`);
        });
    });
}





// Funkcja obsługująca zmiany w formularzu
function handleInputChange(event) {
    const { id, value } = event.target;
    if (id === 'maxDiskSpace') {
        settings[id] = parseInt(value, 10);
    } else {
        settings[id] = value;
    }

    if (id === 'language') {
        fetchDiskSpace();
        updateUI(); // Zaktualizuj tłumaczenia po zmianie języka
    }
}

// Event listener do zapisywania ustawień
document.getElementById('saveButton').addEventListener('click', saveSettings);

// Event listener do aktualizacji lokalnych ustawień
const inputs = document.querySelectorAll('#settingsForm input, #settingsForm select');
inputs.forEach(input => input.addEventListener('change', handleInputChange));

async function fetchSettings() {
    let data;

    try {
        // Pobierz ustawienia z serwera
        const response = await fetch(`${API_URL}/settings`);
        if (response.ok) {
            data = await response.json();

            // Zapisz ustawienia w chrome.storage.local
            chrome.storage.local.set({ settings: data }, () => {
                
            });
        } else {
            throw new Error("Nie udało się pobrać ustawień z serwera, używam lokalnych ustawień.");
        }
    } catch (error) {
        console.warn("Błąd podczas pobierania ustawień z serwera:", error);

        // Pobierz ustawienia z chrome.storage.local
        data = await new Promise((resolve) => {
            chrome.storage.local.get("settings", (result) => {
                if (result.settings) {
                    resolve(result.settings);
                } else {
                    console.error("Brak ustawień w chrome.storage.local");
                    resolve(null);
                }
            });
        });

        if (!data) {
            return; // Jeśli brak ustawień, zakończ działanie
        }
    }

    // Aktualizacja ustawień lokalnych
    settings.language = data.lang;
    settings.recordingQuality = data.quality;
    settings.maxDiskSpace = data.max_space;

    // Zaktualizuj interfejs użytkownika
    document.getElementById('recordingQuality').value = settings.recordingQuality;
    document.getElementById('qualityLabel').textContent = `${settings.recordingQuality} GB`;

    updateUI();
}





// Inicjalizacja aplikacji
fetchSettings();
// Aktualizacja wartości wyświetlanej przy suwaku
document.getElementById('recordingQuality').addEventListener('input', function (event) {
    const value = event.target.value;
    document.getElementById('qualityLabel').textContent = value;
    settings.recordingQuality = parseInt(value, 10); // Aktualizuje bieżące ustawienia
});


document.addEventListener('DOMContentLoaded', function () {
    fetchDiskSpace(); // Pobierz dane o wolnym miejscu na dysku
});
updateUI()
setInterval(fetchDiskSpace, 60000); // Odświeżaj co minutę

