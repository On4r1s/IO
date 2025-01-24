import math
from os import path
import wave
from datetime import datetime
from vosk import Model, KaldiRecognizer, SetLogLevel

SetLogLevel(-1)
data_path = path.join(path.dirname(__file__)[:-10], 'data\\')


def transcribe_audio(file, stamp, lang, photos):
    for i in range(len(photos)):
        photos[i] = datetime.strptime(photos[i], '%Y%m%d-%H%M%S%f')

    wf = wave.open(file, "rb")

    if lang == "en":
        model = Model(lang="en-us")
    else:
        model = Model(lang="pl")

    stamp = datetime.strptime(stamp, '%Y%m%d-%H%M%S%f')

    rec = KaldiRecognizer(model, wf.getframerate())
    rec.SetWords(True)
    rec.SetPartialWords(True)
    frags = []

    n = 0
    while True:
        if len(photos) != 0 and n < len(photos):
            m = math.ceil((photos[n] - stamp).microseconds / 1000000) * wf.getframerate()
            n += 1
        else:
            m = wf.getnframes()

        data = wf.readframes(m)
        if len(data) == 0:
            break
        rec.AcceptWaveform(data)
        val = eval(rec.PartialResult())['partial']
        try:
            frags.index(val)
        except ValueError:
            frags.append(val)
    frags.append(eval(rec.FinalResult())['text'])

    diff_text = []
    if len(photos) != 0:
        for i in range(len(frags) - 1):
            diff_text.append(frags[i + 1][len(frags[i]):len(frags[i + 1])])
    else:
        diff_text = [frags[1]]

    return diff_text
