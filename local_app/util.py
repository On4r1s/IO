from subprocess import Popen, PIPE


def StartRecording():
    p = Popen("python Record.py", stdin=PIPE, stdout=PIPE, shell=True)
    return p


def EndRecording(pipe):
    pipe.communicate(input='F'.encode())
    return
