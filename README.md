# Bot for Meets, Teams and Zoom with AI-powered utilities

## Functionality

- Generating notes and transcriptions 
- Works on Meet / Zoom / Teams
- Integration with calendar
- User friendly UI

## Installation

Download WINRAR if you are not using windows 11 or don't have other archivator

### Offline AI-server

If you want to use DeepSeek or any other local LLM, you need to set up it, to do this, follow this [instruction](https://dev.to/pavanbelagatti/run-deepseek-r1-locally-for-free-in-just-3-minutes-1e82).

### Online AI-server

You don't have to do anything here, continue to the next step.

### Next steps

1. Download .zip of this project, and unpack it (or clone the project)
2. Unpack extension part into chrome
![image](https://github.com/user-attachments/assets/22483c6d-acab-4065-a103-cf8ac25c4734)
3. Download python 3.11
4. Run `python3.11 install.py`, now everything is ready for work
5. Run `python3.11 .\local_app\app.py` to run app
6. Run `python3.11 .\servers\online.py` to run communication server for notes (if you are using offline AI-server, then type `python3.11 .\servers\local.py` instead)
7. Now you can successfully use IO-recorder in your Chrome browser
