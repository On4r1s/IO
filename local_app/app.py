from base64 import b64decode
from io import BytesIO
from PIL import Image
import shutil

#from flask_cors import CORS
from flask import Flask, Response, jsonify, send_file
from util import *
import flask


app = Flask(__name__)
#CORS(app)
global active_pipe


@app.post('/recording')
def recording():
    global active_pipe
    try:
        if flask.request.headers.get('action') == 'start':
            active_pipe = start_recording()
            return Response(status=200)

        elif flask.request.headers.get('action') == 'stop':
            end_recording(active_pipe)
            active_pipe = None
            return Response(status=200)
    except Exception as e:
        print(e)
        return Response(status=400)


@app.post('/image')
def image():
    x = flask.request
    post_json = x.get_json(force=True)
    try:
        Image.open(BytesIO(b64decode(post_json['image'][22:]))).save(img_name())

    except Exception as e:
        print(e)
        return Response(status=400)
    return Response(status=200)


@app.get('/files')
def get_files():
    try:
        return jsonify({"files": os.listdir(os.path.join(data_path, '\\notes'))})
    except Exception as e:
        print(e)
        return Response(status=500)


@app.get('/files/<file>')
def show_file(file):
    if file.lower().endswith('.pdf'):
        file_path = os.path.join(data_path, '\\transcriptions\\'+file)
        if not os.path.isfile(file_path):
            return Response(status=404)
        return send_file(str(file_path), mimetype='application/pdf')
    else:
        file_path = os.path.join(data_path, '\\notes\\'+file)
        if not os.path.isfile(file_path):
            return Response(status=404)
        return send_file(str(file_path))


@app.delete('/files/<file>')
def delete_file(file):
    file_path1 = os.path.join(data_path, '\\notes\\' + file)
    file_path2 = os.path.join(data_path, '\\transcriptions\\' + file)
    if os.path.isfile(file_path1):
        try:
            os.remove(file_path1)
            os.remove(file_path2)
            return Response(status=200)
        except Exception as e:
            print(e)
            return Response(status=500)
    else:
        return Response(status=404)


@app.get('/settings')
def send_settings():
    try:
        send_file(str(os.path.join(data_path, "settings.json")), mimetype='application/pdf')
    except FileNotFoundError:
        return Response(status=404)
    except Exception as e:
        print(e)
        return Response(status=500)


@app.post('/settings')
def change_settings():
    free = shutil.disk_usage("/")[2]
    try:
        to_write = flask.request.get_json(force=True)
        if int(to_write['max_space']) > free:
            Response(status=400)
        with open("../data/settings.json", "w") as f:
            json.dump(to_write, f)
        return Response(status=200)
    except Exception as e:
        print(e)
        return Response(status=500)


if __name__ == '__main__':
    app.run()
