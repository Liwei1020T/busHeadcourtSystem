import os
import sys

# Change to the pi-agent directory
os.chdir(os.path.dirname(os.path.abspath(__file__)))

# Now run the main module
exec(open("main.py").read())
