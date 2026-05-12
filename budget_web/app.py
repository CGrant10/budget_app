from flask import Flask, jsonify, request, render_template
import json, os, csv, io
from datetime import datetime

app = Flask(__name__)
DATA_FILE = os.path.expanduser("~/.budget_data.json")


def load():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE) as f:
            d = json.load(f)
    else:
        d = {}
    d.setdefault("transactions", [])
    d.setdefault("budgets", {})
    d.setdefault("weekly_plan", {})
    return d


def save(data):
    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=2)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/data")
def get_data():
    return jsonify(load())


@app.route("/api/transactions", methods=["POST"])
def add_transaction():
    data = load()
    data["transactions"].append(request.json)
    save(data)
    return jsonify({"ok": True})


@app.route("/api/transactions/<int:idx>", methods=["DELETE"])
def delete_transaction(idx):
    data = load()
    if 0 <= idx < len(data["transactions"]):
        data["transactions"].pop(idx)
        save(data)
    return jsonify({"ok": True})


@app.route("/api/transactions/<int:idx>", methods=["PATCH"])
def patch_transaction(idx):
    data = load()
    if 0 <= idx < len(data["transactions"]):
        data["transactions"][idx].update(request.json)
        save(data)
    return jsonify({"ok": True})


@app.route("/api/weekly_plan", methods=["POST"])
def weekly_plan():
    data = load()
    data["weekly_plan"] = request.json
    save(data)
    return jsonify({"ok": True})


@app.route("/api/import", methods=["POST"])
def import_csv():
    data = load()
    f = request.files.get("file")
    if not f:
        return jsonify({"ok": False, "error": "no file"})
    added = errors = 0
    try:
        reader = csv.DictReader(io.StringIO(f.read().decode("utf-8")))
        for row in reader:
            try:
                keys = {k.strip().lower(): v.strip() for k, v in row.items()}
                data["transactions"].append({
                    "date":        keys.get("date", datetime.today().strftime("%Y-%m-%d")),
                    "type":        keys.get("type", "expense").lower(),
                    "category":    keys.get("category", "Other"),
                    "description": keys.get("description", "—"),
                    "amount":      float(keys.get("amount", "0").replace("$", "").replace(",", "")),
                })
                added += 1
            except Exception:
                errors += 1
        save(data)
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)})
    return jsonify({"ok": True, "added": added, "errors": errors})


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
