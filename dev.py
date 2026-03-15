"""
ObsidiTube — Dev Server Launcher
=================================
Convenience script to start both the FastAPI backend and the Next.js frontend
with a single command:

    uv run python dev.py

Both processes run concurrently. Ctrl+C terminates them both cleanly.
"""

import subprocess
import sys
import os


def main():
    # Resolve absolute paths relative to this file so the script works
    # regardless of the working directory it's invoked from.
    base_dir = os.path.dirname(os.path.abspath(__file__))
    frontend_dir = os.path.join(base_dir, "frontend")

    print("Starting FastAPI Backend...")
    # sys.executable ensures we use the same Python interpreter (and therefore
    # the same virtual environment) that is running this script.
    # --reload enables hot-reload so backend changes apply without restart.
    backend_process = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "api:app", "--reload", "--port", "8000"],
        cwd=base_dir,
    )

    print("Starting Next.js Frontend...")
    # shell=True is required on Windows so that `npm` (a .cmd script) is found.
    frontend_process = subprocess.Popen(
        ["npm", "run", "dev"],
        cwd=frontend_dir,
        shell=os.name == "nt",  # True on Windows, False on Unix
    )

    try:
        # Block until both processes exit (they won't under normal operation).
        backend_process.wait()
        frontend_process.wait()
    except KeyboardInterrupt:
        # Ctrl+C: gracefully stop both servers before exiting.
        print("\nShutting down servers...")
        backend_process.terminate()
        frontend_process.terminate()
        sys.exit(0)


if __name__ == "__main__":
    main()
