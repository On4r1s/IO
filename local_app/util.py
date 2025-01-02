import json
import os
from subprocess import Popen, PIPE
import datetime
import io
import cv2
import numpy as np
from skimage.metrics import structural_similarity as ssim
from pydub import AudioSegment
import asyncio
from pdfMake import create_pdf

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
    for photo in photos_stamps[stamp]:
        os.remove(data_path + '.temp\\imgs\\' + photo + '.png')
    os.remove(data_path + f'.temp\\audio\\input{stamp}.wav')
    os.remove(data_path + f'.temp\\audio\\output{stamp}.wav')
    del photos_stamps[stamp]
    return


def save_image(img, stamp):
    img = Image.open(io.BytesIO(img))
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
    try:
        to_send = str(photos_stamps[stamp]).replace('"', "'").replace(" ", "")
    except KeyError:
        to_send = []

    output = AudioSegment.from_wav(f'{data_path}.temp/audio/output{stamp}.wav')
    input = AudioSegment.from_wav(f'{data_path}.temp/audio/input{stamp}.wav')

    if output.duration_seconds > input.duration_seconds:
        combined = output.overlay(input)
    else:
        combined = input.overlay(output)
    combined = combined.set_frame_rate(16000)

    combined.export(f'{data_path}.temp/audio/combined{stamp}.wav', format='wav')

    p = Popen(f"python Transcribe.py combined {stamp} {settings['lang']} {to_send}",
                  stdin=PIPE, stdout=PIPE, shell=True)

    transcribed = [elem[1:-1].replace('\r\n\x1b[0', '') for elem in
                       str(p.stdout.read().decode('utf-8')).split("_")]

    print(transcribed)


    # need to think, temporal solution
    # gpt_request(transcribed_out, stamp)

    asyncio.run(create_pdf(transcribed, data_path, photos_stamps))

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