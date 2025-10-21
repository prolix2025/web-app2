from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["http://localhost:5500", "http://127.0.0.1:5500", "http://localhost:5173", "http://localhost:3000"]}})

@app.route("/health")
def health():
    return jsonify({"status": "ok"})

@app.post("/extract")
def extract():
    if "file" not in request.files:
        return jsonify({"error": "file missing"}), 400
    f = request.files["file"]
    _ = f.read(512)  # prove we got it

    extracted = {
        "invoice_date": "2025-10-01",
        "invoice_amount": "1234.56",
        "btw_amount": "214.56",
        "btw_number": "NL123456789B01",
        "kvk": "87654321",
        "supplier": "Xavora BV",
        "notes": f"Auto-extracted from {f.filename}",
    }
    return jsonify(extracted)

if __name__ == "__main__":
    app.run(port=8000, debug=True)
