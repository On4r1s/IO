from base64 import b64decode
from io import BytesIO
from PIL import Image
import shutil

#from flask_cors import CORS
from flask import Flask, Response, jsonify, send_file
from util import *
import flask
import re


app = Flask(__name__)
#CORS(app)
global active_pipe


@app.post('/recording')
def recording():
    global active_pipe
    try:
        if flask.request.headers.get('action') == 'start':
            active_pipe = start_recording()
            return Response(status=200)

        elif flask.request.headers.get('action') == 'stop':
            end_recording(active_pipe)
            active_pipe = None
            return Response(status=200)
    except Exception as e:
        print(e)
        return Response(status=400)


@app.post('/image')
def image():
    x = flask.request
    post_json = x.get_json(force=True)
    try:
        Image.open(BytesIO(b64decode(post_json['image'][22:]))).save(img_name())

    except Exception as e:
        print(e)
        return Response(status=400)
    return Response(status=200)


@app.get('/files')
def get_files():
    try:
        return jsonify({"files": os.listdir(os.path.join(data_path, '\\notes'))})
    except Exception as e:
        print(e)
        return Response(status=500)


@app.get('/files/<file>')
def show_file(file):
    if file.lower().endswith('.pdf'):
        file_path = os.path.join(data_path, '\\transcriptions\\'+file)
        if not os.path.isfile(file_path):
            return Response(status=404)
        return send_file(str(file_path), mimetype='application/pdf')
    else:
        file_path = os.path.join(data_path, '\\notes\\'+file)
        if not os.path.isfile(file_path):
            return Response(status=404)
        return send_file(str(file_path))


@app.delete('/files/<file>')
def delete_file(file):
    file_path1 = os.path.join(data_path, '\\notes\\' + file)
    file_path2 = os.path.join(data_path, '\\transcriptions\\' + file)
    if os.path.isfile(file_path1):
        try:
            os.remove(file_path1)
            os.remove(file_path2)
            return Response(status=200)
        except Exception as e:
            print(e)
            return Response(status=500)
    else:
        return Response(status=404)


@app.get('/settings')
def send_settings():
    try:
        send_file(str(os.path.join(data_path, "settings.json")), mimetype='application/pdf')
    except FileNotFoundError:
        return Response(status=404)
    except Exception as e:
        print(e)
        return Response(status=500)


@app.post('/settings')
def change_settings():
    free = shutil.disk_usage("/")[2]
    try:
        to_write = flask.request.get_json(force=True)
        if int(to_write['max_space']) > free:
            Response(status=400)
        with open("../data/settings.json", "w") as f:
            json.dump(to_write, f)
        return Response(status=200)
    except Exception as e:
        print(e)
        return Response(status=500)


@app.get('/meetings')
def view_meetings():
    try:
        filename = "../data/spotkania.json"
        
        # Jeśli plik nie istnieje, utwórz go
        if not os.path.exists(filename):
            with open(filename, "w") as file:
                json.dump([], file)  # Tworzy pustą listę w pliku JSON
            print(f"Plik '{filename}' został utworzony.")
        
        # Odczytaj zawartość pliku JSON
        with open(filename, "r") as file:
            meetings = json.load(file)

        # Zwróć zawartość pliku JSON
        return jsonify(meetings), 200
    
    except Exception as e:
        print(e)
        return Response(str(e), status=500)
    
def save_meetings(meetings):
    filename = "../data/spotkania.json"
    with open(filename, "w") as file:
        json.dump(meetings, file, indent=4)

def load_meetings():
    filename = "../data/spotkania.json"
    with open(filename, "r") as file:
        try:
            meetings = json.load(file)
            # Dodaj brakujące ID, jeśli ich nie ma
            for idx, meeting in enumerate(meetings):
                if "id" not in meeting:
                    meeting["id"] = idx + 1
            return meetings
        except json.JSONDecodeError:
            # Obsługa uszkodzonego pliku JSON
            print(f"Plik {filename} jest uszkodzony. Tworzę nowy pusty plik.")
            with open(filename, "w") as file:
                json.dump([], file)
            return []

# Add meeting endpoint
@app.route("/add-meeting", methods=["POST"])
def add_meeting():
    try:
        if not flask.request.is_json:  # Sprawdź, czy dane są w formacie JSON
            raise ValueError("Dane nie są w formacie JSON")
        new_meeting = flask.request.get_json()  # Pobierz dane w formacie JSON

                # Sprawdź, czy wszystkie wymagane pola są obecne
        required_fields = ["date", "startTime", "endTime", "link"]
        if not all(field in new_meeting for field in required_fields):
            return jsonify({"error": "Brak wymaganych pól w danych"}), 400

        date = new_meeting["date"]
        start_time = new_meeting["startTime"]
        end_time = new_meeting["endTime"]
        link = new_meeting["link"]

        # Walidacja daty
        try:
            meeting_date = datetime.strptime(date, "%Y-%m-%d")
            if meeting_date.date() < datetime.today().date():
                return jsonify({"error": "Data spotkania musi być dzisiejsza lub późniejsza"}), 400
        except ValueError:
            return jsonify({"error": "Niepoprawny format daty, oczekiwano YYYY-MM-DD"}), 400

        # Walidacja czasu
        try:
            start = datetime.strptime(start_time, "%H:%M")
            end = datetime.strptime(end_time, "%H:%M")
            if start >= end:
                return jsonify({"error": "Godzina rozpoczęcia musi być wcześniejsza niż godzina zakończenia"}), 400
        except ValueError:
            return jsonify({"error": "Niepoprawny format godziny, oczekiwano HH:MM"}), 400

        # Walidacja linku
        if not re.match(r'https?://[^\s]+', link):
            return jsonify({"error": "Podano niepoprawny URL"}), 400

        if not new_meeting:
            raise ValueError("Brak danych w żądaniu")
        
        # Dodaj spotkanie do pliku
        meetings = load_meetings()

        # Przypisz nowe unikalne ID
        new_id = max([meeting["id"] for meeting in meetings], default=0) + 1
        new_meeting["id"] = new_id

        meetings.append(new_meeting)
        save_meetings(meetings)

        return jsonify({"message": "Spotkanie dodane", "meetings": meetings}), 201
    except Exception as e:
        print(f"Błąd podczas dodawania spotkania: {e}")  # Loguj błąd
        return jsonify({"error": str(e)}), 500



@app.route("/delete-meeting/<int:meeting_id>", methods=["DELETE"])
def delete_meeting(meeting_id):
    try:
        meetings = load_meetings()
        for meeting in meetings:
            if meeting["id"] == meeting_id:
                meetings.remove(meeting)
                save_meetings(meetings)
                return jsonify({"message": "Spotkanie usunięte", "deleted": meeting, "meetings": meetings}), 200
        return jsonify({"error": "Nie znaleziono spotkania o podanym ID"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run()
