import json
import os
from subprocess import Popen, PIPE
import datetime
from io import BytesIO
import cv2
import numpy as np
from skimage.metrics import structural_similarity as ssim
from pydub import AudioSegment
from PyPDF2 import PdfReader
from pdfMake import create_pdf
from Transcribe import transcribe_audio

from PIL import Image
from requests import request

data_path = os.path.join(os.path.dirname(__file__)[:-10], 'data\\')
settings = json.load(open(data_path + 'settings.json'))
photos_stamps = {}


def mse(img1: bytes, img2: bytes) -> float:
    img1_gray = cv2.cvtColor(cv2.imdecode(np.frombuffer(img1, dtype=np.uint8), cv2.IMREAD_COLOR), cv2.COLOR_BGR2GRAY)
    img2_gray = cv2.cvtColor(cv2.imdecode(np.frombuffer(img2, dtype=np.uint8), cv2.IMREAD_COLOR), cv2.COLOR_BGR2GRAY)

    if img1_gray.shape != img2_gray.shape:
        raise ValueError

    score, _ = ssim(img1_gray, img2_gray, full=True)

    return score


def img_name(stamp):
    global photos_stamps
    name = datetime.datetime.now().strftime("%Y%m%d-%H%M%S%f")
    try:
        photos_stamps[stamp]
    except KeyError:
        photos_stamps[stamp] = []
    photos_stamps[stamp].append(name)
    return data_path + '\\.temp\\imgs\\' + name + '.png'


def delete_files(stamp):
    global photos_stamps
    try:
        for photo in photos_stamps[stamp]:
            os.remove(data_path + '.temp\\imgs\\' + photo + '.png')
            del photos_stamps[stamp]
    except KeyError:
        pass
    os.remove(data_path + f'.temp\\audio\\input{stamp}.wav')
    os.remove(data_path + f'.temp\\audio\\output{stamp}.wav')
    os.remove(data_path + f'.temp\\audio\\combined{stamp}.wav')
    return


def save_image(img, stamp):
    img = Image.open(BytesIO(img))
    sizes = [int(elem * int(settings['quality']) / 100) for elem in img.size]
    img = img.resize(sizes, Image.Resampling.LANCZOS)
    img.save(img_name(stamp))
    return


def start_recording(stamp):
    p = Popen(f"python Record.py {stamp}", stdin=PIPE, stdout=PIPE, shell=True)
    return p


def end_recording(pipe):
    pipe.communicate(input='F'.encode())
    return


def transcribe(stamp):

    output_stream = AudioSegment.from_wav(f'{data_path}.temp/audio/output{stamp}.wav')
    input_stream = AudioSegment.from_wav(f'{data_path}.temp/audio/input{stamp}.wav')

    if output_stream.duration_seconds > input_stream.duration_seconds:
        combined = output_stream.overlay(input_stream)
    else:
        combined = input_stream.overlay(output_stream)

    file_name = f'{data_path}.temp/audio/combined{stamp}.wav'
    combined.export(file_name, format='wav')

    try:
        transcribed = transcribe_audio(file_name, stamp, settings['lang'], photos_stamps[stamp])
    except KeyError:
        transcribed = transcribe_audio(file_name, stamp, settings['lang'], [])

    print(transcribed)

    # gpt_request(transcribed, stamp)
    print(photos_stamps)
    print(stamp)
    create_pdf(transcribed, data_path, photos_stamps, stamp)
    #delete_files(stamp)

    return


def gpt_request(transcription, stamp):
    text = ''
    for elem in transcription:
        text += ' ' + elem
    body = '{"lang":"' + settings['lang'] + '", "transcription": "' + text + '"}'
    r = request(method="GET", url='http://localhost:8080/note', json=body, verify=False)
    f = open(f'{data_path}notes\\note_{stamp}.txt', 'xb')
    f.write(r.text.encode('utf-8'))
    return


def read_file_with_encoding(file_path):
    """
    Próbuj odczytać plik z różnymi kodowaniami.
    :param file_path: Ścieżka do pliku.
    :return: Treść pliku.
    """
    encodings = ['utf-8', 'ISO-8859-2', 'windows-1250']  # Kodowania do sprawdzenia
    for encoding in encodings:
        try:
            with open(file_path, 'r', encoding=encoding) as file:
                return file.read()
        except UnicodeDecodeError:
            continue
    raise Exception(f"Nie udało się odczytać pliku {file_path} z dostępnymi kodowaniami.")


def search_in_file(file_path, search_text):
    """
    Sprawdza, czy podany ciąg znaków znajduje się w pliku tekstowym lub PDF.

    :param file_path: Ścieżka do pliku.
    :param search_text: Ciąg znaków do wyszukania.
    :return: True, jeśli ciąg znaków znajduje się w pliku, False w przeciwnym razie.
    """
    if file_path.lower().endswith('.txt'):
        try:
            content = read_file_with_encoding(file_path)
            return search_text in content
        except Exception as e:
            raise Exception(f"Nie udało się otworzyć pliku tekstowego: {e}")

    elif file_path.lower().endswith('.pdf'):
        try:
            reader = PdfReader(file_path)
            for page in reader.pages:
                if search_text in page.extract_text():
                    return True
            return False
        except Exception as e:
            raise Exception(f"Nie udało się otworzyć pliku PDF: {e}")

    else:
        raise ValueError("Obsługiwane są tylko pliki z rozszerzeniem .txt lub .pdf.")


"""
def find_next_meeting(file_path):
    # Wczytanie danych z pliku JSON
    with open(file_path, 'r') as file:
        data = file.read()  # Wczytaj zawartość jako tekst
        #print("Wczytane dane:", data)  # Debug: wyświetl wczytane dane
        meetings = json.loads(data)  # Przekształć tekst na obiekt JSON
        #print("Meetings jako JSON:", meetings)  # Debug: wyświetl przetworzone dane
    # Parsowanie daty i czasu oraz znalezienie najbliższego spotkania
    now = datetime.datetime.now()
    
    # Tworzymy listę spotkań z przekształconą datą i czasem
    parsed_meetings = [
        {
            **meeting,
            "start_datetime": datetime.datetime.strptime(meeting["date"] + " " + meeting["startTime"], "%Y-%m-%d %H:%M")
        }
        for meeting in meetings
    ]

    # Filtrujemy spotkania, które zaczynają się po aktualnym czasie
    future_meetings = [m for m in parsed_meetings if m["start_datetime"] > now]

    # Sortujemy przyszłe spotkania po czasie rozpoczęcia
    future_meetings.sort(key=lambda m: m["start_datetime"])

    # Zwracamy pierwsze najbliższe spotkanie (lub None jeśli brak)
    return future_meetings[0] if future_meetings else None
    """
