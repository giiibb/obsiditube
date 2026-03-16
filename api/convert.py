"""
ObsidiTube — Vercel Python Serverless Function
===============================================
Exposes the /api/convert endpoint as a Vercel serverless function.
Vercel picks this up automatically from the `api/` directory.

Uses `mangum` to adapt the FastAPI ASGI app to the AWS Lambda / Vercel runtime.
"""

import sys
import os
import importlib.util

# Ensure the project root is on sys.path
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

# Load api.py from the project root directly (avoids conflict with this api/ package)
_spec = importlib.util.spec_from_file_location("obsiditube_api", os.path.join(ROOT, "api.py"))
_mod = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_mod)
app = _mod.app  # the FastAPI app

from mangum import Mangum

# Mangum wraps FastAPI as a Lambda-compatible handler — Vercel Python uses the same interface.
handler = Mangum(app, lifespan="off")

