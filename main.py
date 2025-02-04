import asyncio
import subprocess
import sys
import time


def main(argv):
    print("Started, type anything to quit:", end=' ')
    app = subprocess.Popen(["python3.11", "local_app\\app.py"], stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                           stderr=subprocess.PIPE)

    try:
        if argv[1] == 'local':
            server = subprocess.Popen(["python3.11", "servers\\local.py"], stdin=subprocess.PIPE,
                                      stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        else:
            print('Wrong argument, exiting...')
            app.communicate()
            exit(1)

    except IndexError:
        server = subprocess.Popen(["python3.11", "servers\\online.py"], stdin=subprocess.PIPE,
                                  stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    while not input():
        time.sleep(2)

    app.kill()
    server.kill()

    print('Exiting...')
    return 0


if __name__ == '__main__':
    main(sys.argv)
