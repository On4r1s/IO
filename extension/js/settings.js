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
        en:"English",
        pl:"Polish",
        recordingQualityOptions: {
            low: "Low",
            medium: "Medium",
            high: "High"
        }
    },
    pl: {
        languageLabel: "Język:",
        recordingQualityLabel: "Jakość nagrywania:",
        maxDiskSpaceLabel: "Maksymalne miejsce na dysku (GB):",
        saveButton: "Zapisz ustawienia",
        diskSpaceInfoLabel: "Wolne miejsce na dysku:",
        errorFetchingDiskSpace: "Nie udało się pobrać informacji o miejscu na dysku.",
        en:"Angielski",
        pl:"Polski",
        recordingQualityOptions: {
            low: "Niska",
            medium: "Średnia",
            high: "Wysoka"
        }
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

// Funkcja wysyłająca ustawienia do serwera
async function saveSettings() {
    try {
        const response = await fetch(`${API_URL}/settings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                max_space: settings.maxDiskSpace,
                quality: settings.recordingQuality,
                lang: settings.language
            })
        });

        if (response.ok) {
            alert("Ustawienia zapisane pomyślnie.");
        } else {
            const text = await response.text();
            alert(`Błąd podczas zapisywania ustawień: ${text}`);
        }
    } catch (error) {
        console.error("Błąd podczas zapisywania ustawień:", error);
    }
    fetchDiskSpace();
    updateUI();
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
        updateUI(); // Zaktualizuj tłumaczenia po zmianie języka
    }
}

// Event listener do zapisywania ustawień
document.getElementById('saveButton').addEventListener('click', saveSettings);

// Event listener do aktualizacji lokalnych ustawień
const inputs = document.querySelectorAll('#settingsForm input, #settingsForm select');
inputs.forEach(input => input.addEventListener('change', handleInputChange));

async function fetchSettings() {
    try {
        const response = await fetch(`${API_URL}/settings`);
        if (!response.ok) {
            throw new Error("Nie udało się pobrać ustawień");
        }
        const data = await response.json();

        // Aktualizacja ustawień lokalnych
        settings.language = data.lang;
        settings.recordingQuality = data.quality;
        settings.maxDiskSpace = data.max_space;

        // Zaktualizuj interfejs użytkownika
        document.getElementById('recordingQuality').value = settings.recordingQuality;
        document.getElementById('qualityLabel').textContent = `${settings.recordingQuality} GB`;
    } catch (error) {
        console.error("Błąd:", error);
    }
}



// Inicjalizacja aplikacji
fetchSettings();
// Aktualizacja wartości wyświetlanej przy suwaku
document.getElementById('recordingQuality').addEventListener('input', function (event) {
    const value = event.target.value;
    document.getElementById('qualityLabel').textContent = value;
    settings.recordingQuality = parseInt(value, 10); // Aktualizuje bieżące ustawienia
});

async function fetchDiskSpace() {
    try {
        const response = await fetch(`${API_URL}/disk-space`);
        if (!response.ok) {
            throw new Error("Błąd podczas pobierania informacji o miejscu na dysku");
        }
        const data = await response.json();
        // Wyświetl wolne miejsce
        document.getElementById('diskSpaceInfo').textContent = 
            `Wolne miejsce: ${data.free} GB / ${data.total} GB`;
    } catch (error) {
        console.error("Błąd:", error);
        document.getElementById('diskSpaceInfo').textContent = 
            "Nie udało się pobrać informacji o wolnym miejscu.";
    }
}
document.addEventListener('DOMContentLoaded', function () {
    fetchDiskSpace(); // Pobierz dane o wolnym miejscu na dysku
});
updateUI()
setInterval(fetchDiskSpace, 60000); // Odświeżaj co minutę

