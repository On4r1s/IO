import json
import os
from subprocess import Popen, PIPE
import datetime
import io
import cv2
import numpy as np
from skimage.metrics import structural_similarity as ssim

from PIL import Image
from requests import request

data_path = os.path.join(os.path.dirname(__file__)[:-10], 'data\\')
settings = json.load(open(data_path + 'settings.json'))
photos_stamps = []


def mse(img1: bytes, img2: bytes) -> float:
    img1_gray = cv2.cvtColor(cv2.imdecode(np.frombuffer(img1, dtype=np.uint8), cv2.IMREAD_COLOR), cv2.COLOR_BGR2GRAY)
    img2_gray = cv2.cvtColor(cv2.imdecode(np.frombuffer(img2, dtype=np.uint8), cv2.IMREAD_COLOR), cv2.COLOR_BGR2GRAY)

    if img1_gray.shape != img2_gray.shape:
        raise ValueError

    score, _ = ssim(img1_gray, img2_gray, full=True)

    return score


def img_name():
    global photos_stamps
    name = datetime.datetime.now().strftime("%Y%m%d-%H%M%S%f")
    photos_stamps.append(name)
    return data_path + '\\.temp\\imgs\\' + name + '.png'


def delete_files(stamp):
    global photos_stamps
    for photo in photos_stamps:
        os.remove(data_path + '.temp\\imgs\\' + photo + '.png')
    os.remove(data_path + f'.temp\\audio\\input{stamp}.wav')
    os.remove(data_path + f'.temp\\audio\\output{stamp}.wav')
    photos_stamps = []
    return


def save_image(img):
    img = Image.open(io.BytesIO(img))
    sizes = [int(elem * int(settings['quality']) / 100) for elem in img.size]
    img = img.resize(sizes, Image.Resampling.LANCZOS)
    img.save(img_name())
    return


def start_recording():
    p = Popen("python Record.py", stdin=PIPE, stdout=PIPE, shell=True)
    return p


def end_recording(pipe):
    return str(pipe.communicate(input='F'.encode())[0])[2:-5]


def transcribe(stamp):
    to_send = str(photos_stamps).replace('"', "'").replace(" ", "")

    p_out = Popen(f"python Transcribe.py output {stamp} {settings['lang']} {to_send}",
                  stdin=PIPE, stdout=PIPE, shell=True)
    p_in = Popen(f"python Transcribe.py input {stamp} {settings['lang']} {to_send}",
                 stdin=PIPE, stdout=PIPE, shell=True)

    transcribed_out = [elem[1:-1].replace('\r\n\x1b[0', '') for elem in
                       str(p_out.stdout.read().decode('utf-8')).split("_")]
    transcribed_in = [elem[1:-1].replace('\r\n\x1b[0', '') for elem in
                      str(p_in.stdout.read().decode('utf-8')).split("_")]

    print(transcribed_in)
    print(transcribed_out)

    # need to think, temporal solution
    gpt_request(transcribed_out, stamp)
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
