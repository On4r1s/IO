import asyncio
from datetime import datetime
from os import path

import pyaudiowpatch as pyaudio
import wave

data_path = path.join(path.dirname(__file__)[:-10], 'data\\')


def take_and_skip_elements(input_tuple):
    index = 0
    result = b''
    while index < len(input_tuple):
        result += (input_tuple[index:index + 4])
        index += 8
    return result


def stream_open(file, default_audio):
    # do not change, pyaudio gives 4 args
    def callback(in_data, frame_count, time_info, status):
        file.writeframes(take_and_skip_elements(in_data))
        return in_data, pyaudio.paContinue

    return p.open(format=pyaudio.paInt16,
                  channels=default_audio["maxInputChannels"],
                  rate=int(default_audio["defaultSampleRate"]),
                  frames_per_buffer=512,
                  input=True,
                  input_device_index=default_audio["index"],
                  stream_callback=callback)


# may be need to change in the future, wave write only rewrite the whole file, cannot append
def write_to_file(filename, default_audio):
    file = wave.open(filename, 'wb')
    file.setnchannels(1)
    file.setsampwidth(pyaudio.get_sample_size(pyaudio.paInt16))
    file.setframerate(int(default_audio["defaultSampleRate"]))
    return file


async def record(default_audio, flow):

    if flow == 'output':
        # bad method, another solution not found, but it just works(bethesda moment)
        if not default_audio["isLoopbackDevice"]:
            for loopback in p.get_loopback_device_info_generator():
                if default_audio["name"] in loopback["name"]:
                    default_audio = loopback
                    break

    file = write_to_file(f'{data_path}.temp/audio/{flow}{stamp}.wav', default_audio)

    stream = stream_open(file, default_audio)

    try:

        while True:
            await asyncio.sleep(1)

    except asyncio.CancelledError:  # end recording
        stream.stop_stream()
        stream.close()
        file.close()


# if received not None input -> ends recording
async def end_streams(tasks):
    val = None
    while val is None:
        try:
            val = input()
        except EOFError:
            val = None
    for task in tasks:
        task.cancel()
    print(stamp)


async def main():
    async with asyncio.TaskGroup() as tg:
        task1 = tg.create_task(record(p.get_device_info_by_index(wasapi['defaultOutputDevice']), 'output'))
        task2 = tg.create_task(record(p.get_device_info_by_index(wasapi['defaultInputDevice']), 'input'))
        tg.create_task(end_streams([task1, task2]))


if __name__ == "__main__":
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S%f")
    p = pyaudio.PyAudio()
    try:
        wasapi = p.get_host_api_info_by_type(pyaudio.paWASAPI)
    except OSError:
        raise Exception("Looks like WASAPI is not available on the system.")
    asyncio.run(main())
