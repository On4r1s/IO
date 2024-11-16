import pyaudio
import wave

FORMAT = pyaudio.paInt16
CHANNELS = 2
RATE = 48000
CHUNK = 1024
RECORD_SECONDS = 7
OUTPUT_FILENAME = "output.wav"

audio = pyaudio.PyAudio()

dev_index = 0
for i in range(audio.get_device_count()):
    dev = audio.get_device_info_by_index(i)
    if (dev['name'] == 'Stereo Mix (Realtek(R) Audio)' and dev['hostApi'] == 0):
        dev_index = dev['index']

stream = audio.open(format=FORMAT, channels=CHANNELS,
                rate=RATE, input=True, input_device_index = dev_index,
                frames_per_buffer=CHUNK)

print("Recording...")

frames = []

for i in range(0, int(RATE / CHUNK * RECORD_SECONDS)):
    data = stream.read(CHUNK)
    frames.append(data)

print("Recording finished")

stream.stop_stream()
stream.close()
audio.terminate()

waveFile = wave.open(OUTPUT_FILENAME, 'wb')
waveFile.setnchannels(CHANNELS)
waveFile.setsampwidth(audio.get_sample_size(FORMAT))
waveFile.setframerate(RATE)
waveFile.writeframes(b''.join(frames))
waveFile.close()