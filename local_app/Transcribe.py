import asyncio
import math
import sys
import wave
from datetime import datetime
from vosk import Model, KaldiRecognizer, SetLogLevel

SetLogLevel(-1)


async def main(file, stamp, lang, photos):
    for i in range(len(photos)):
        photos[i] = datetime.strptime(photos[i], '%Y%m%d-%H%M%S%f')

    # only output for now
    wf = wave.open(f"../data/.temp/audio/{file}{stamp}.wav", "rb")

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
        read_frames = 0
        if len(photos) != 0 and n < len(photos):
            m = math.ceil((photos[n] - stamp).microseconds / 1000000) * wf.getframerate()
            n += 1
            read_frames += m
        else:
            m = wf.getnframes() - read_frames

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
    for i in range(len(frags) - 1):
        diff_text.append(frags[i + 1][len(frags[i]):len(frags[i + 1])])

    print(str(diff_text).replace("[", "").replace("]", "").replace(", ", "_"))
    return


if __name__ == "__main__":
    asyncio.run(main(sys.argv[1], sys.argv[2], sys.argv[3], eval(sys.argv[4])))
