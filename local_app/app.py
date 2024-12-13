from base64 import b64decode
from io import BytesIO
from pathlib import Path
from shutil import disk_usage

from flask import Flask, Response, jsonify, send_file
import flask
from flask_cors import CORS
import re
from util import *

app = Flask(__name__)
# will work without, but better to have it
CORS(app)
global active_pipe
global prev_img
global time_start
global active_stamp


@app.post('/recording')
def recording():
    global active_pipe
    global time_start
    global prev_img
    global active_stamp
    try:
        # if recording is less than 1 second, delete audio + photos(if any)
        if time_start >= datetime.datetime.now() - datetime.timedelta(seconds=1):
            time_start = None
            end_recording(active_pipe)
            delete_files(active_stamp)
            active_pipe = None
            active_stamp = None
            prev_img = None
            return 'nah', 200
    except (NameError, TypeError):
        time_start = datetime.datetime.now()
    try:
        if flask.request.headers.get('action') == 'start':
            active_stamp = datetime.datetime.now().strftime("%Y%m%d-%H%M%S%f")
            active_pipe = start_recording(active_stamp)
            return Response(status=200)

        elif flask.request.headers.get('action') == 'stop':
            active_pipe = None
            stamp = active_stamp
            active_stamp = None
            return Response(response=stamp, status=200)
    except Exception:
        try:
            end_recording(active_pipe)  # double start ?
            active_pipe = None
            active_stamp = None
            time_start = None
            prev_img = None
        except Exception as e:
            print(e)
        return Response(status=400)


@app.post('/analyze')
def analyze():
    try:
        transcribe(flask.request.headers.get('stamp'))
        return Response(status=200)
    except Exception as e:
        print(e)
        return Response(status=400)


@app.post('/image')
def image():
    x = flask.request
    post_json = x.get_json(force=True)
    global prev_img
    try:
        img = BytesIO(b64decode(post_json['image'][22:])).read()
        try:
            prev_img == b''
        except (NameError, TypeError):
            prev_img = img
            try:
                save_image(img, active_stamp)
            except TypeError:
                return Response(status=400)
            return Response(status=200)
        if prev_img != img:
            try:
                diff = mse(prev_img, img)
            except ValueError:
                prev_img = img
                save_image(img, active_stamp)
                return Response(status=200)
            if diff < 0.9:
                prev_img = img
            else:
                return Response(status=200)
            save_image(img, active_stamp)

    except Exception as e:
        print(e)
        return Response(status=400)
    return Response(status=200)


# to have info about used space, and other stuff
@app.get('/health')
def health():
    used = sum(f.stat().st_size for f in Path(data_path).glob('**/*') if f.is_file()) / 1073741824
    return {"left": str(int(settings['max_space']) - used.__round__(6))}, 200


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
        file_path = os.path.join(data_path, '\\transcriptions\\' + file)
        if not os.path.isfile(file_path):
            return Response(status=404)
        return send_file(str(file_path), mimetype='application/pdf')
    else:
        file_path = os.path.join(data_path, '\\notes\\' + file)
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
        return send_file(str(os.path.join(data_path, "settings.json")), mimetype='application/pdf')
    except FileNotFoundError:
        return Response(status=404)
    except Exception as e:
        print(e)
        return Response(status=500)


@app.post('/settings')
def change_settings():
    global settings
    free = disk_usage("/")[2] / 1073741824
    used = sum(f.stat().st_size for f in Path(data_path).glob('**/*') if f.is_file()) / 1073741824
    try:
        to_write = flask.request.get_json(force=True)
        if used >= int(to_write['max_space']) >= free:
            Response(status=400)
        with open(data_path + "settings.json", "w") as f:
            json.dump(to_write, f)
            settings = to_write
        return Response(status=200)
    except Exception as e:
        print(e)
        return Response(status=500)


@app.get('/meetings')
def view_meetings():
    try:
        filename = data_path + "spotkania.json"

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
    filename = data_path + "spotkania.json"
    with open(filename, "w") as file:
        json.dump(meetings, file, indent=4)


def load_meetings():
    filename = data_path + "spotkania.json"
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
            with open(filename, "w") as f:
                json.dump([], f)
            return []


# Add meeting endpoint
@app.post("/add-meeting")
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
            meeting_date = datetime.datetime.strptime(date, "%Y-%m-%d")
            if meeting_date.date() < datetime.datetime.today().date():
                return jsonify({"error": "Data spotkania musi być dzisiejsza lub późniejsza"}), 400
        except ValueError:
            return jsonify({"error": "Niepoprawny format daty, oczekiwano YYYY-MM-DD"}), 400

        # Walidacja czasu
        try:
            start = datetime.datetime.strptime(start_time, "%H:%M")
            end = datetime.datetime.strptime(end_time, "%H:%M")
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


@app.delete("/delete-meeting/<int:meeting_id>")
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
