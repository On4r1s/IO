const API_URL = "http://127.0.0.1:5000";

async function listMeetings() {
    try {
      const response = await fetch("http://127.0.0.1:5000/meetings");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json(); // Parsowanie odpowiedzi do JSON
      console.log("Odpowiedź API:", data); // Sprawdzenie danych w konsoli
  
      const meetingsList = document.getElementById("meetingsList");
      meetingsList.innerHTML = "";
            data.forEach((meeting, index) => {
              // Tworzenie elementu spotkania
              const meetingItem = document.createElement("div");
              meetingItem.className = "meeting-item";
              meetingItem.innerHTML = `
                  <strong>Data:</strong> ${meeting.date || "Brak danych"} <br>
                  <strong>Godzina rozpoczęcia:</strong> ${meeting.startTime || "Brak danych"} <br>
                  <strong>Godzina zakończenia:</strong> ${meeting.endTime || "Brak danych"} <br>
                  <strong>Link:</strong> <a href="${meeting.link}" target="_blank">${meeting.link || "Brak linku"}</a> <br>
                  <button class="delete-button" data-index="${index}">Usuń</button>
              `;
  
              meetingsList.appendChild(meetingItem);
          });
  
          // Dodaj nasłuchiwacz dla wszystkich przycisków "Usuń"
          const deleteButtons = document.querySelectorAll(".delete-button");
          deleteButtons.forEach(button => {
              button.addEventListener("click", () => {
                  const meetingId = button.getAttribute("data-index");
                  deleteMeeting(meetingId);
              });
          });
      }
     catch (error) {
        console.error("Błąd:", error);
      }
  
}

document.addEventListener("DOMContentLoaded", () => {
  const button = document.getElementById("meetingsButton");
  button.addEventListener("click", listMeetings);
});


// Dodawanie spotkania
document.getElementById("addMeetingForm").addEventListener("submit", event => {
    event.preventDefault(); // Zapobiega przeładowaniu strony

    const date = document.getElementById("date").value;
    const startTime = document.getElementById("startTime").value;
    const endTime = document.getElementById("endTime").value;
    const link = document.getElementById("link").value;

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
            listMeetings(); // Odśwież listę spotkań
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
        await listMeetings(); // Odśwież listę
    } catch (error) {
        console.error("Błąd podczas usuwania spotkania:", error);
    }
}


document.addEventListener("DOMContentLoaded", () => {
  listMeetings();
});