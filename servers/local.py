import json
import subprocess

import flask
import ollama

app = flask.Flask(__name__)
proc = subprocess.Popen("ollama serve", stdout=subprocess.PIPE, stderr=subprocess.PIPE, stdin=subprocess.PIPE,
                        shell=True)


def my_strip(text):
    marker = "</think>"
    index = text.find(marker)
    if index != -1:
        return text[index + len(marker) + 2:]
    return text


@app.get('/note')
def deepseek():
    post_json = json.loads(flask.request.get_json(force=True))

    if post_json['lang'] == 'en':
        prompt = ("Give me a note from this transcribed text, don't write anything besides that note, don't add  "
                  f"dont use markdown for style:\n{post_json['transcription']}")
    else:
        prompt = ('Daj mi notatkę z tego transkrybowanego tekstu, nie pisz nic poza tą notatką, nie pisz wprowazdenia '
                  'od siebie, nie używaj Markdowna dla stylów:\n{post_json["transcription"]}')

    response = ollama.chat(model='deepseek-r1', messages=[
        {
            'role': 'user',
            'content': prompt,
        },
    ])

    return my_strip(response['message']['content'])


# must be param --port=8080 (or any other than 5000) when using on the same pc as local-app
if __name__ == '__main__':
    app.run(port=8080)
