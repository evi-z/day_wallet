import os
from dotenv import load_dotenv

load_dotenv()

API_PATH = os.getenv("BACKEND_API_PATH", "/api/v1")