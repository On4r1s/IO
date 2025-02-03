import os

from vosk import Model, SetLogLevel

SetLogLevel(-1)

data_path = os.path.join(os.path.dirname(__file__)[:-10], 'data\\')


def main():
    directories = ['.temp', 'notes', 'transcripts', '.temp\\audio', '.temp\\imgs']
    for directory in directories:
        try:
            os.mkdir(os.path.join(data_path, directory))
        except FileExistsError:
            pass

    Model(lang="en-us")
    Model(lang="pl")

    return 1


if __name__ == "__main__":
    main()
