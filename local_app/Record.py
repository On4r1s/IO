import asyncio
import time
import pyaudiowpatch as pyaudio
import wave


def stream_open(file, default_audio):
    # do not change, pyaudio gives 4 args
    def callback(in_data, frame_count, time_info, status):
        file.writeframes(in_data)
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
    file.setnchannels(default_audio["maxInputChannels"])
    file.setsampwidth(pyaudio.get_sample_size(pyaudio.paInt16))
    file.setframerate(int(default_audio["defaultSampleRate"]))
    return file


async def record_output(default_audio):
    # bad method, another solution not found, but it just works(bethesda moment)
    if not default_audio["isLoopbackDevice"]:
        for loopback in p.get_loopback_device_info_generator():
            if default_audio["name"] in loopback["name"]:
                default_audio = loopback
                break
            else:
                raise Exception("Default loopback output device not found.\n\nRun `python -m pyaudiowpatch` to check "
                                "available devices.")

    file = write_to_file('../data/.temp/output.wav', default_audio)

    stream = stream_open(file, default_audio)

    try:

        while True:
            await asyncio.sleep(1)

    except asyncio.CancelledError:  # end recording
        stream.stop_stream()
        stream.close()
        file.close()


async def record_input(default_audio):

    file = write_to_file('../data/.temp/input.wav', default_audio)

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


async def main():
    async with asyncio.TaskGroup() as tg:
        task1 = tg.create_task(record_output(p.get_device_info_by_index(wasapi['defaultOutputDevice'])))
        task2 = tg.create_task(record_input(p.get_device_info_by_index(wasapi['defaultInputDevice'])))
        tg.create_task(end_streams([task1, task2]))


if __name__ == "__main__":
    time_start = time.time()  # for monitoring, to delete
    p = pyaudio.PyAudio()
    try:
        wasapi = p.get_host_api_info_by_type(pyaudio.paWASAPI)
    except OSError:
        raise Exception("Looks like WASAPI is not available on the system.")
    asyncio.run(main())
