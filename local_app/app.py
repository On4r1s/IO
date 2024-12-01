import os
from base64 import b64decode
from datetime import datetime
from io import BytesIO
from PIL import Image

from flask_cors import CORS
from flask import Flask, request, Response, jsonify, send_file
# from flask import render_template_string ((this is for markdown))
import util
# import markdown ((this is for markdown))

app = Flask(__name__)
CORS(app)
global active_pipe
data_path = os.path.join(os.path.dirname(__file__)[:-10], 'data\\')


@app.post('/recording')
def recording():
    global active_pipe
    try:
        if request.headers.get('action') == 'start':
            active_pipe = util.StartRecording()
            print('Pipe opened')
            return Response(status=200)

        elif request.headers.get('action') == 'stop':
            util.EndRecording(active_pipe)
            active_pipe = None
            print('pipe closed')
            return Response(status=200)
    except Exception:
        return Response(status=400)


@app.post('/image')
def image():
    post_json = request.get_json(force=True)
    try:
        img = Image.open(BytesIO(b64decode(post_json['image'][22:])))

        img_name = data_path + datetime.now().strftime('%Y-%m-%d %H-%M-%S') + '.png'
        img.save(img_name)

    except Exception:
        return Response(status=400)
    return Response(status=200)

@app.route('/files', methods=['GET'])
def files():
    try:
        files = os.listdir(data_path)
        return jsonify({"files": files})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/files/<file>', methods=['GET'])
def view_file(file):
    file_path = os.path.join(data_path, file)
    if not os.path.isfile(file_path):
        return jsonify({"error": "File not found"}), 404

    if file.lower().endswith('.pdf'):
        return send_file(file_path, mimetype='application/pdf')
    # elif file.lower().endswith('.md'):
    #     try:
    #         with open(file_path, 'r', encoding='utf-8') as file:
    #             md_content = file.read()
    #         # Convert Markdown to HTML
    #         html_content = markdown.markdown(md_content)
    #         # Serve the HTML with embedded images
    #         return render_template_string(f"""
    #                     <!DOCTYPE html>
    #                     <html>
    #                     <head>
    #                         <title>{file}</title>
    #                     </head>
    #                     <body>
    #                         {html_content}
    #                     </body>
    #                     </html>
    #                 """)
    #     except UnicodeDecodeError as e:
    #         return jsonify({"error": f"Failed to decode file: {str(e)}"}), 500
    #     except Exception as e:
    #         return jsonify({"error": f"Failed to render Markdown: {str(e)}"}), 500
    else:
        return send_file(file_path)

@app.route('/files/<file>', methods=['DELETE'])
def delete_file(file):
    file_path = os.path.join(data_path, file)
    if os.path.isfile(file_path):
        try:
            os.remove(file_path)
            return jsonify({"message": f"File {file} deleted successfully"}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    else:
        return jsonify({"error": "File not found"}), 404

if __name__ == '__main__':
    app.run()
