import os
import sys

# Change to the backend directory
os.chdir(os.path.dirname(os.path.abspath(__file__)))

# Run uvicorn
import uvicorn
uvicorn.run("app.main:app", host="0.0.0.0", port=8003, reload=False)
