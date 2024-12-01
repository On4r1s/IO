import os
from subprocess import Popen, PIPE
from datetime import datetime

data_path = os.path.join(os.path.dirname(__file__)[:-10], 'data\\')
photos = []


def img_name():
    global photos
    name = datetime.now().strftime("%Y%m%d-%H%M%S%f")
    photos.append(name)
    return data_path + name + '.png'


def start_recording():
    p = Popen("python Record.py", stdin=PIPE, stdout=PIPE, shell=True)
    return p


def end_recording(pipe):
    transcribe(str(pipe.communicate(input='F'.encode())[0])[2:-5])
    return


def transcribe(stamp):
    to_send = str(photos).replace('"', "'").replace(" ", "")

    p_out = Popen(f"python Transcribe.py output {stamp} {to_send}", stdin=PIPE, stdout=PIPE, shell=True)
    p_in = Popen(f"python Transcribe.py input {stamp} {to_send}", stdin=PIPE, stdout=PIPE, shell=True)

    transcribed_out = [elem[1:-1].replace('\r\n\x1b[0', '') for elem in
                       str(p_out.stdout.read().decode('utf-8')).split("_")]
    transcribed_in = [elem[1:-1].replace('\r\n\x1b[0', '') for elem in
                      str(p_in.stdout.read().decode('utf-8')).split("_")]

    print(transcribed_in)
    print(transcribed_out)  # make it useful, duh
    return
