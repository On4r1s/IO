import os
import subprocess


def main():
    data_path = os.path.join(os.path.dirname(__file__), 'local_app\\')
    subprocess.run(["pip", "install", "-r", "requirements.txt"], shell=True)
    subprocess.run(["python", os.path.join(data_path, 'install_app.py')], shell=True)
    print("Done!")
    return 0

if __name__ == "__main__":
    main()