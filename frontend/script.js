// Tłumaczenia
const translations = {
  pl: {
      start: "start",
      stop: "stop",
      labelResolution: "jakość:",
      labelMeetingDate: "Wybierz datę spotkania:",
      labelMeetingTime: "Wybierz godzinę spotkania:",
      labelMeetingDuration: "Wybierz długość spotkania:",
      hoursLabel: "godzin",
      minutesLabel: "minut",
      confirmDate: "Zatwierdź datę i długość",
      confirmationMessage: "Zatwierdzono!"
  },
  en: {
      start: "Start",
      stop: "Stop",
      labelResolution: "Quality:",
      labelMeetingDate: "Select meeting date:",
      labelMeetingTime: "Select meeting time:",
      labelMeetingDuration: "Select meeting duration:",
      hoursLabel: "hours",
      minutesLabel: "minutes",
      confirmDate: "Confirm date and duration",
      confirmationMessage: "Confirmed!"
  }
};

// Aktualizacja tekstów
function updateLanguage(lang) {
  document.getElementById("start").textContent = translations[lang].start;
  document.getElementById("stop").textContent = translations[lang].stop;
  document.getElementById("label-resolution").textContent = translations[lang].labelResolution;
  document.getElementById("label-meetingDate").textContent = translations[lang].labelMeetingDate;
  document.getElementById("label-meetingTime").textContent = translations[lang].labelMeetingTime;
  document.getElementById("label-meetingDuration").textContent = translations[lang].labelMeetingDuration;
  document.getElementById("hours-label").textContent = translations[lang].hoursLabel;
  document.getElementById("minutes-label").textContent = translations[lang].minutesLabel;
  document.getElementById("confirmDate").textContent = translations[lang].confirmDate;
  document.getElementById("confirmationMessage").textContent = "";
}

// Inicjalizacja
document.addEventListener("DOMContentLoaded", () => {
  const languageSelector = document.getElementById("language");
  languageSelector.addEventListener("change", (event) => {
      const selectedLang = event.target.value;
      updateLanguage(selectedLang);
  });

  // Ustaw domyślny język
  updateLanguage("pl");
});
document.addEventListener("DOMContentLoaded", () => {
  // Inicjalizacja FullCalendar
  const calendarEl = document.getElementById('calendar');
  const calendar = new FullCalendar.Calendar(calendarEl, {
      locale: 'pl', // Domyślny język kalendarza
      initialView: 'dayGridMonth',
      editable: true,
      selectable: true,
      headerToolbar: {
          start: 'prev,next today', // Nawigacja
          center: 'title',         // Tytuł miesiąca
          end: 'dayGridMonth,timeGridWeek,timeGridDay' // Widoki
      },
      events: [], // Początkowa lista wydarzeń
      dateClick: function (info) {
          const title = prompt('Podaj tytuł wydarzenia:');
          if (title) {
              calendar.addEvent({
                  title: title,
                  start: info.dateStr,
                  allDay: true
              });
          }
      },
      eventClick: function (info) {
          if (confirm(`Czy na pewno chcesz usunąć wydarzenie: "${info.event.title}"?`)) {
              info.event.remove();
          }
      }
  });

  calendar.render();

  // Obsługa zmiany języka
  const languageSelector = document.getElementById("language");
  languageSelector.addEventListener("change", (event) => {
      const selectedLang = event.target.value;
      calendar.setOption('locale', selectedLang === 'pl' ? 'pl' : 'en');
  });
});
