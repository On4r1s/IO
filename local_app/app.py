from base64 import b64decode
from io import BytesIO
from PIL import Image

#from flask_cors import CORS
from flask import Flask, request, Response, jsonify, send_file
from util import *


app = Flask(__name__)
#CORS(app)
global active_pipe
# no lang support yet

@app.post('/recording')
def recording():
    global active_pipe
    try:
        if request.headers.get('action') == 'start':
            active_pipe = start_recording()
            print('Pipe opened')
            return Response(status=200)

        elif request.headers.get('action') == 'stop':
            end_recording(active_pipe)
            active_pipe = None
            print('pipe closed')
            return Response(status=200)
    except Exception as e:
        print(e)
        return Response(status=400)


@app.post('/image')
def image():
    post_json = request.get_json(force=True)
    try:
        Image.open(BytesIO(b64decode(post_json['image'][22:]))).save(img_name())

    except Exception as e:
        print(e)
        return Response(status=400)
    return Response(status=200)


@app.get('/files')
def get_files():
    try:
        return jsonify({"files": os.listdir(data_path)})
    except Exception as e:
        print(e)
        return Response(status=500)


@app.get('/files/<file>')
def show_file(file):
    file_path = os.path.join(data_path, file)
    if not os.path.isfile(file_path):
        return Response(status=404)

    if file.lower().endswith('.pdf'):
        return send_file(str(file_path), mimetype='application/pdf')
    else:
        return send_file(str(file_path))


@app.delete('/files/<file>')
def delete_file(file):
    file_path = os.path.join(data_path, file)
    if os.path.isfile(file_path):
        try:
            os.remove(file_path)
            return Response(status=200)
        except Exception as e:
            print(e)
            return Response(status=500)
    else:
        return Response(status=404)


if __name__ == '__main__':
    app.run()
