import asyncio
import sys
import time


async def main(argv):
    print("Started, type anything to quit:", end=' ')
    app = await asyncio.create_subprocess_shell(
        "local_app/app.py ",
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE)

    try:
        if argv[1] == 'local':
            server = await asyncio.create_subprocess_shell(
                "servers/local.py",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE)
        else:
            print('Wrong argument, exiting...')
            await app.communicate()
            exit(1)

    except IndexError:
        server = await asyncio.create_subprocess_shell(
            "servers/online.py",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE)

    while not input():
        time.sleep(3)

    await app.communicate()
    await server.communicate()

    print('Exiting...')
    return 0

if __name__ == '__main__':
    asyncio.run(main(sys.argv))
