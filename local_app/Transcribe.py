import json
import wave
from datetime import datetime
from vosk import Model, KaldiRecognizer, SetLogLevel

SetLogLevel(-1)


def transcribe_audio(file, stamp, lang, photos):
    timestamps = [datetime.strptime(photo, '%Y%m%d-%H%M%S%f') for photo in photos]
    wf = wave.open(file, "rb")

    model = Model(lang="en-us" if lang == "en" else "pl")

    start_stamp = datetime.strptime(stamp, '%Y%m%d-%H%M%S%f')

    rec = KaldiRecognizer(model, wf.getframerate())
    rec.SetWords(True)

    text_segments = []
    full_text = ""
    prev_stamp = start_stamp
    for ts in timestamps:
        if ts:
            frame_count = int((ts - prev_stamp).total_seconds() * wf.getframerate())
        else:
            frame_count = wf.getnframes()
        prev_stamp = ts
        data = wf.readframes(frame_count)
        if len(data) == 0:
            break

        if rec.AcceptWaveform(data):
            result = json.loads(rec.Result())["text"]
        else:
            result = json.loads(rec.PartialResult())["partial"]

        new_text = result[len(full_text):]
        text_segments.append(new_text)
        full_text = result

    final_text = json.loads(rec.FinalResult())["text"]
    new_text = final_text[len(full_text):]
    text_segments.append(new_text)

    cleaned_text = [" ".join(text.splitlines()).strip() for text in text_segments]

    return cleaned_text
