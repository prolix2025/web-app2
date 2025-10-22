from datetime import datetime
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS

app = Flask(__name__, static_folder="static", template_folder="templates", static_url_path="/static")
CORS(app, resources={r"/api/*": {"origins": "*"}})

@app.get("/")
def home():
    # Render the new UI (ported from your localhost app)
    return render_template("index.html")

@app.post("/api/extract")
def extract():
    """Accepts an uploaded file and returns extracted invoice fields.
    This is a stub that mirrors the localhost API shape used by app.js (invoice_date, invoice_amount, btw_amount, btw_number, kvk, supplier, notes).
    Replace with real extraction when ready.
    """
    if "file" not in request.files:
        return jsonify({"error": "file missing"}), 400
    f = request.files["file"]
    _ = f.read(512)  # prove we got it

    # Demo payload that matches the localhost app.js hydrateForm() keys
    payload = {
        "invoice_date": "2025-10-01",
        "invoice_amount": "1234.56",
        "btw_amount": "214.56",
        "btw_number": "NL123456789B01",
        "kvk": "87654321",
        "supplier": "Xavora BV",
        "notes": f"Auto-extracted from {f.filename}",
    }
    return jsonify(payload)

if __name__ == "__main__":
    # Local run
    app.run(host="0.0.0.0", port=8000, debug=True)
