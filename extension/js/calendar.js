const API_URL = "http://127.0.0.1:5000";

function listmeetings() {
  fetch("http://127.0.0.1:5000/meetings")
      .then(response => {
          if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json(); // Parsowanie odpowiedzi do JSON
      })
      .then(data => {
          console.log("Odpowiedź API:", data); // Sprawdzenie danych w konsoli

          const meetingsList = document.getElementById("meetingsList");
          meetingsList.innerHTML = ""; // Czyszczenie listy, jeśli istnieją stare dane

          data.forEach(meeting => {
              const meetingItem = document.createElement("div");
              meetingItem.innerHTML = `
                  <strong>Data:</strong> ${meeting.date || "Brak danych"} <br>
                  <strong>Godzina rozpoczęcia:</strong> ${meeting.startTime || "Brak danych"} <br>
                  <strong>Godzina zakończenia:</strong> ${meeting.endTime || "Brak danych"} <br>
                  <strong>Link:</strong> <a href="${meeting.link}" target="_blank">${meeting.link || "Brak linku"}</a>
              `;
              meetingsList.appendChild(meetingItem);
          });
      })
      .catch(error => {
          console.error("Błąd podczas pobierania danych:", error);
      });
}


document.addEventListener("DOMContentLoaded", () => {
  const button = document.getElementById("meetingsButton");
  button.addEventListener("click", listmeetings());
});

document.addEventListener("DOMContentLoaded", () => {
  listmeetings();
});