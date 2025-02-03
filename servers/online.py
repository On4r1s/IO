import json
import os

from openai import OpenAI
import flask

app = flask.Flask(__name__)
client = OpenAI(api_key=os.getenv("API_KEY"))


@app.get('/note')
def gpt():
    post_json = json.loads(flask.request.get_json(force=True))
    if post_json['lang'] == 'en':
        prompt = ("Give me a note from this transcribed text, don't write anything besides that note, "
                  f"dont use markdown for style:\n{post_json['transcription']}")
    else:
        prompt = ('Daj mi notatkę z tego transkrybowanego tekstu, nie pisz nic poza tą notatką, nie używaj Markdowna '
                  f'dla stylów:\n{post_json["transcription"]}')

    stream = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        stream=True,
    )
    answer = ''
    for chunk in stream:
        if chunk.choices[0].delta.content is not None:
            answer += chunk.choices[0].delta.content
    return answer


# must be param --port=8080 (or any other than 5000) when using on the same pc as local-app
if __name__ == '__main__':
    app.run(port=8080)
