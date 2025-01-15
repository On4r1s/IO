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
    }
};
async function listFiles() {
    const fileList = document.getElementById("file-list");
    //fileList.innerHTML = `<li>Loading files...</li>`;
    try {
        const response = await fetch(`${API_URL}/files`);
        const data = await response.json();
        fileList.innerHTML = "";

        if (data.notes || data.transcriptions) {
            if (data.notes && data.notes.length > 0) {
                const notesHeader = document.createElement("h3");
                notesHeader.textContent = "Notes:";
                fileList.appendChild(notesHeader);

                const notesList = document.createElement("ul");
                data.notes.forEach(file => {
                    const li = document.createElement("li");
                    li.textContent = file;
                    notesList.appendChild(li);
                });
                fileList.appendChild(notesList);
            }

            if (data.transcriptions && data.transcriptions.length > 0) {
                const transcriptionsHeader = document.createElement("h3");
                transcriptionsHeader.textContent = "Transcriptions:";
                fileList.appendChild(transcriptionsHeader);

                const transcriptionsList = document.createElement("ul");
                data.transcriptions.forEach(file => {
                    const li = document.createElement("li");
                    li.textContent = file;
                    transcriptionsList.appendChild(li);
                });
                fileList.appendChild(transcriptionsList);
            }
        } else {
            fileList.innerHTML = `<li>No files found.</li>`;
        }
    } catch (error) {
        console.error("Error fetching files:", error);
        fileList.innerHTML = `<li>Error fetching files. Please try again later.</li>`;
    }
}



async function viewFile() {
    const filename = document.getElementById("view-filename").value;
    if (!filename) {
        alert("Please enter a file name");
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
                throw new Error("File not found or error occurred.");
            }
            const content = await response.text();
            fileContentsTextarea.value = content;
        } catch (error) {
            fileContentsTextarea.value = error.message;
        }
    }
}


// Attach the viewFile function to the button
document.getElementById("viewOneFileButton").addEventListener("click", viewFile);

// Delete a file
// Delete a file
async function deleteFile() {
    const filename = document.getElementById("delete-filename").value;
    if (!filename) {
        alert("Please enter a file name");
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/files/${filename}`, { method: "DELETE" });
        if (response.ok) {
            document.getElementById("delete-message").textContent = "File deleted successfully.";
        } else if (response.status === 404) {
            document.getElementById("delete-message").textContent = "File not found.";
        } else {
            const errorData = await response.json().catch(() => ({ error: "Unknown error occurred." }));
            document.getElementById("delete-message").textContent = errorData.error || "An error occurred.";
        }
        listFiles(); // Refresh file list
    } catch (error) {
        console.error("Error deleting file:", error);
        document.getElementById("delete-message").textContent = "Failed to delete the file. Please try again.";
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
                displayMessage("Please enter a file name.", "error");
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
            alert('Proszę wpisać frazę do wyszukania.');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/search/${encodeURIComponent(query)}`);
            if (!response.ok) {
                throw new Error('Błąd podczas komunikacji z serwerem.');
            }

            const data = await response.json();
            const files = data.matching_files;

            if (files.length === 0) {
                resultsList.innerHTML = '<li>Brak wyników.</li>';
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
            alert('Wystąpił błąd podczas wyszukiwania. Spróbuj ponownie.');
        }
    });
});
