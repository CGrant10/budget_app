import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "budget_web"))

from budget_web.app import app as flask_app
from flaskwebgui import FlaskUI

if __name__ == "__main__":
    FlaskUI(
        app=flask_app,
        server="flask",
        width=430,
        height=860,
        port=5173,
    ).run()
