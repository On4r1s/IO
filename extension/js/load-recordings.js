const API_URL = "http://127.0.0.1:5000";
language = "en"
const calendarLangDict = {
    pl: {
        title: "Zarządzanie plikami",
        listAllFiles: "Wszystkie pliki",
        getFiles: "Pokaż pliki",
        viewFile: "Obejrzyj plik",
        enterFileName: "Wprowadź nazwę pliku",
        fillerFileText: "Zawartość pliku pojawi się tutaj",
        deleteFile: "Usuń plik",
        backButton: "Powrót",
        searchFiles: "Wyszukaj w plikach",
        searchButton: "Szukaj",
        searchResult: "Wyniki wyszukiwania",
        enterPhase:"Wpisz frazę do wyszukania...",
        viewFile: "Obejrzyj plik",
        enterFileAlert: "Wprowadź nazwę pliku",
        deletionFileError: "Nie udało się usunąć pliku. Spróbuj ponownie.",
        deletioSuccesfull: "Plik usunięty pomyślnie",
        fileNotFound: "Plik nie zostal znaleziony",
        errorOcurred: "Nie znaleziono pliku lub wystąpił błąd.",
        fetchFilesError: "Błąd podczas pobierania plików. Spróbuj ponownie później.",
        serwerCommunicationError: "Błąd podczas komunikacji z serwerem.",
        enterSearch: "Proszę wpisać frazę do wyszukania.",
        noResults: "Brak wyników.",
        again: "Spróbuj ponownie",
        filesNotFound: "Pliki nie zostały znalezione",
        notes: "Notatki",
        transcriptions: "Transkrypcje:",
        viewFileButton: "Obejrzyj",
    },
    en: {
        title: "File Management",
        listAllFiles: "All Files",
        getFiles: "Get Files",
        viewFile: "View File",
        enterFileName: "Enter File Name",
        fillerFileText: "File content will appear here",
        deleteFile: "Delete File",
        backButton: "Back",
        searchFiles: "Search in files",
        searchButton: "Search",
        searchResult: "Results of a search",
        enterPhase: "Enter Phase to search...",
        viewFile: "View File",
        enterFileAlert: "Please enter a file name",
        deletionFileError: "Failed to delete the file. Please try again.",
        deletioSuccesfull: "File deleted successfully.",
        fileNotFound: "File not found.",
        errorOcurred: "File not found or error occurred.",
        fetchFilesError: "Error fetching files. Please try again later.",
        serwerCommunicationError: "Communication error with the server.",
        enterSearch: "Please enter the phrase to search for.", 
        noResuls: "No search results", 
        again: "Wystąpił błąd podczas wyszukiwania. Spróbuj ponownie.",
        filesNotFound: "Files not found.",
        notes: "Notes:",
        transcriptions: "Transcriptions:",
        viewFileButton: "View",
    }
};
async function listFiles() {
    const fileList = document.getElementById("file-list");
    // fileList.innerHTML = `<li>Loading files...</li>`;
    try {
        const response = await fetch(`${API_URL}/files`);
        const data = await response.json();
        fileList.innerHTML = "";

        if (data.notes || data.transcriptions) {
            if (data.notes && data.notes.length > 0) {
                const notesHeader = document.createElement("h3");
                notesHeader.textContent = calendarLangDict[language].notes;
                fileList.appendChild(notesHeader);

                const notesList = document.createElement("ul");
                data.notes.forEach(file => {
                    const li = document.createElement("li");
                    li.textContent = file;

                    // Dodaj przycisk dla każdego pliku
                    const button = document.createElement("button");
                    button.id = "dedicatedViewFileButton";
                    button.textContent = calendarLangDict[language].viewFileButton || "View";
                    button.addEventListener("click", () => viewFile(file)); // Wywołaj viewFile z argumentem
                    li.appendChild(button);

                    notesList.appendChild(li);
                });
                fileList.appendChild(notesList);
            }

            if (data.transcriptions && data.transcriptions.length > 0) {
                const transcriptionsHeader = document.createElement("h3");
                transcriptionsHeader.textContent = calendarLangDict[language].transcriptions;
                fileList.appendChild(transcriptionsHeader);

                const transcriptionsList = document.createElement("ul");
                data.transcriptions.forEach(file => {
                    const li = document.createElement("li");
                    li.textContent = file;

                    // Dodaj przycisk dla każdego pliku
                    const button = document.createElement("button");
                    button.id = "dedicatedViewFileButton";
                    button.textContent = calendarLangDict[language].viewFileButton || "View";
                    button.addEventListener("click", () => viewFile(file)); // Wywołaj viewFile z argumentem
                    li.appendChild(button);

                    transcriptionsList.appendChild(li);
                });
                fileList.appendChild(transcriptionsList);
            }
        } else {
            fileList.innerHTML = `<li>${calendarLangDict[language].filesNotFound}</li>`;
        }
    } catch (error) {
        console.error("Error fetching files:", error);
        fileList.innerHTML = `<li>${calendarLangDict[language].fetchFilesError}</li>`;
    }
}



async function viewFile(filenameargument = null) {
    let filename;
    if (filenameargument !== null) {
        filename = filenameargument;
    } else {
        filename = document.getElementById("view-filename").value;
    }
    if (!filename) {
        alert(calendarLangDict[language].enterFileAlert);
        return;
    }

    const fileContent = document.getElementById("file-content");
    const fileContentsTextarea = document.getElementById("file-contents");
    fileContent.innerHTML = ""; // Clear previous content

    const fileExtension = filename.split('.').pop().toLowerCase();

    if (fileExtension === "pdf") {
        // Hide the textarea if the file is a PDF
        fileContentsTextarea.style.display = "none";

        // Render PDF in an iframe
        fileContent.innerHTML = `<iframe src="${API_URL}/files/${filename}" style="width: 100%; height: 500px;"></iframe>`;
    } else {
        // Show the textarea for non-PDF files
        fileContentsTextarea.style.display = "block";

        try {
            const response = await fetch(`${API_URL}/files/${filename}`);
            if (!response.ok) {
                if (response.status === 404) {
                    fileContentsTextarea.value = "The requested file was not found. Please upload the file or try another name.";
                    return;
                } else {
                    throw new Error("File not found or error occurred.");
                }
            }
            const content = await response.text();
            fileContentsTextarea.value = content;
        } catch (error) {
            fileContentsTextarea.value = error.message;
        }
    }
}


// Attach the viewFile function to the button
//document.getElementById("viewOneFileButton").addEventListener("click", viewFile);

// Delete a file
// Delete a file
async function deleteFile() {
    const filename = document.getElementById("delete-filename").value;
    if (!filename) {
        alert(calendarLangDict[language].enterFileAlert);
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/files/${filename}`, { method: "DELETE" });
        if (response.ok) {
            document.getElementById("delete-message").textContent = calendarLangDict[language].deletioSuccesfull;
        } else if (response.status === 404) {
            document.getElementById("delete-message").textContent = calendarLangDict[language].fileNotFound;
        } else {
            const errorData = await response.json().catch(() => ({ error: "Unknown error occurred." }));
            document.getElementById("delete-message").textContent = errorData.error || "An error occurred.";
        }
        listFiles(); // Refresh file list
    } catch (error) {
        console.error("Error deleting file:", error);
        document.getElementById("delete-message").textContent = calendarLangDict[language].deletionFileError;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const deleteButton = document.getElementById("delete-button");

    if (deleteButton) {
        deleteButton.addEventListener("click", () => {
            const filenameInput = document.getElementById("delete-filename");
            const filename = filenameInput.value.trim(); // Pobranie nazwy pliku z pola tekstowego

            if (filename) {
                deleteFile(filename); // Wywołanie funkcji usuwania z nazwą pliku
            } else {
                displayMessage(calendarLangDict[language].enterFileAlert, "error");
            }
        });
    } else {
        console.error("Delete button not found in the DOM.");
    }
});
function displayMessage(message, type) {
    const messageElement = document.getElementById("delete-message");
    messageElement.textContent = message;

    if (type === "success") {
        messageElement.style.color = "green";
    } else if (type === "error") {
        messageElement.style.color = "red";
    }
}


const viewFilesButton = document.getElementById("view_files_button");
viewFilesButton.addEventListener("click", () => {
    listFiles();
});

const viewOneFileButton = document.getElementById("viewOneFileButton");
viewOneFileButton.addEventListener("click", () => {
    viewFile();
});
document.getElementById('backButton').addEventListener('click', function() {
    chrome.tabs.update({
        url: chrome.runtime.getURL('html/main.html')
    })
});


function translatePage(lang) {
    if (!calendarLangDict[lang]) {
        console.error(`Language "${lang}" is not supported.`);
        return;
    }

    const translations = calendarLangDict[lang];

    // Map translations to elements
    document.getElementById("fileManagement").textContent = translations.title;
    document.getElementById("listFiles").textContent = translations.listAllFiles;
    document.getElementById("view_files_button").textContent = translations.getFiles;
    document.getElementById("viewFiles").textContent = translations.viewFile;
    document.getElementById("view-filename").placeholder = translations.enterFileName;
    document.getElementById("file-contents").placeholder = translations.fillerFileText;
    document.getElementById("deleteFile").textContent = translations.deleteFile;
    document.getElementById("delete-filename").placeholder = translations.enterFileName;
    document.getElementById("delete-button").textContent = translations.deleteFile;
    document.getElementById("backButton").textContent = translations.backButton;
    document.getElementById("searchFiles").textContent = translations.searchFiles;
    document.getElementById("searchButton").textContent = translations.searchButton;
    document.getElementById("searchResult").textContent = translations.searchResult;
    document.getElementById("searchText").placeholder = translations.enterPhase;
    document.getElementById("viewFiles").textContent = translations.viewFile
    document.getElementById("viewOneFileButton").textContent = translations.viewFile
}

chrome.storage.local.get("settings", (result) => {
    language = result.settings?.lang || "en"; // Default to English
    translatePage(language);
    
});

document.addEventListener('DOMContentLoaded', () => {
    const searchButton = document.getElementById('searchButton');
    const searchText = document.getElementById('searchText');
    const resultsDiv = document.getElementById('results');
    const resultsList = document.getElementById('resultsList');

    searchButton.addEventListener('click', async function() {
        const query = searchText.value.trim();
        resultsList.innerHTML = ''; // Clear previous results
        resultsDiv.style.display = 'none';

        if (!query) {
            alert(calendarLangDict[language].enterSearch);
            return;
        }

        try {
            const response = await fetch(`${API_URL}/search/${encodeURIComponent(query)}`);
            if (!response.ok) {
                throw new Error(calendarLangDict[language].serwerCommunicationError);
            }

            const data = await response.json();
            const files = data.matching_files;

            if (files.length === 0) {
                resultsList.innerHTML = `<li>${calendarLangDict[language].noResults}</li>`;
            } else {
                files.forEach(file => {
                    const li = document.createElement('li');
                    li.textContent = file;
                    resultsList.appendChild(li);
                });
            }

            resultsDiv.style.display = 'block';
        } catch (error) {
            console.error('Błąd:', error);
            alert(calendarLangDict[language].again);
        }
    });
});

listFiles();
