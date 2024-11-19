from flask import Flask, request, Response
import util

app = Flask(__name__)
global active_pipe


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


if __name__ == '__main__':
    app.run()
