from subprocess import Popen, PIPE


def StartRecording():
    p = Popen("python Record.py", stdin=PIPE, stdout=PIPE, shell=True)
    print('Pipe opened')
    return p


def EndRecording(pipe):
    out = pipe.communicate(input='F'.encode())
    print('pipe closed')
    return str(out[0].decode())
