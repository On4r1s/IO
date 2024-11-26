import os
from base64 import b64decode
from datetime import datetime
from io import BytesIO
from PIL import Image

from flask import Flask, request, Response
import util

app = Flask(__name__)
global active_pipe
data_path = os.path.join(os.path.dirname(__file__)[:-10], 'data\\')


@app.post('/recording')
def recording():
    global active_pipe
    try:
        if request.headers.get('action') == 'start':
            active_pipe = util.StartRecording()
            return Response(status=200)

        elif request.headers.get('action') == 'stop':
            print(util.EndRecording(active_pipe))
            active_pipe = None
            return Response(status=200)
    except (NameError, TypeError, Exception) as e:
        print(e)
        return Response(status=400)


@app.post('/image')
def image():
    post_json = request.get_json(force=True)
    try:
        img = Image.open(BytesIO(b64decode(post_json['image'][22:])))

        img_name = data_path + datetime.now().strftime('%Y-%m-%d %H-%M-%S') + '.png'
        img.save(img_name)

    except Exception as e:
        print(e)
        return Response(status=400)
    return Response(status=200)


if __name__ == '__main__':
    app.run()
