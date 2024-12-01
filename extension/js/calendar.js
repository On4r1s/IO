
document.addEventListener('DOMContentLoaded', function () {
  var calendarEl = document.getElementById('calendar');
  var overlay = document.getElementById('overlay');
  var eventForm = document.getElementById('eventForm');
  var calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    editable: true,
    selectable: true,
    events: [],

    // Event click to prevent redirect
    eventClick: function (info) {
      info.jsEvent.preventDefault(); // Zapobiega domyślnemu zachowaniu (przekierowaniu)
      if (confirm(`Czy chcesz usunąć spotkanie: ${info.event.title}?`)) {
        info.event.remove();
      }
    },

    // Day click to add event
    dateClick: function (info) {
      openForm(info.dateStr);
    }
  });
  calendar.render();

  // Open the event form
  function openForm(date) {
    document.getElementById('eventDate').value = date;
    eventForm.style.display = 'block';
    overlay.style.display = 'block';
  }

  // Close the event form
  function closeForm() {
    eventForm.style.display = 'none';
    overlay.style.display = 'none';
  }

  // Add event to calendar
  document.getElementById('addEventButton').addEventListener('click', function () {
    var title = document.getElementById('eventTitle').value;
    var link = document.getElementById('eventLink').value;
    var date = document.getElementById('eventDate').value;
    var startTime = document.getElementById('eventStartTime').value;
    var endTime = document.getElementById('eventEndTime').value;

    if (!title) {
      alert('Proszę podać tytuł spotkania.');
      return;
    }

    if (!startTime || !endTime) {
      alert('Proszę podać godzinę rozpoczęcia i zakończenia.');
      return;
    }

    var startDateTime = `${date}T${startTime}`;
    var endDateTime = `${date}T${endTime}`;

    calendar.addEvent({
      title: title,
      start: startDateTime,
      end: endDateTime,
      url: link // Link można dalej wprowadzać, ale nie działa domyślne przekierowanie
    });
    closeForm();
  });

  // Close form on overlay click
  overlay.addEventListener('click', closeForm);
});