import subprocess
import sys
import os

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    frontend_dir = os.path.join(base_dir, "frontend")

    print("Starting FastAPI Backend...")
    # Using 'uvicorn' assuming it is available in the environment path or uv environment
    # Note: Using `sys.executable -m uvicorn` ensures the active python environment is used.
    backend_process = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "api:app", "--reload", "--port", "8000"],
        cwd=base_dir,
    )

    print("Starting Next.js Frontend...")
    # On Windows, using shell=True or finding npm.cmd is required
    frontend_process = subprocess.Popen(
        ["npm", "run", "dev"],
        cwd=frontend_dir,
        shell=os.name == "nt"
    )

    try:
        backend_process.wait()
        frontend_process.wait()
    except KeyboardInterrupt:
        print("\nShutting down servers...")
        backend_process.terminate()
        frontend_process.terminate()
        sys.exit(0)

if __name__ == "__main__":
    main()
