import os
allow_origins=["*"], # TODO: lock this down to your domain(s)
allow_credentials=True,
allow_methods=["*"],
allow_headers=["*"],
)


# Serve static frontend
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.get("/health")
def health():
return {"status": "ok"}


@app.post("/extract")
async def extract(file: UploadFile = File(...)):
# Basic safety checks (you can expand these)
allowed = {"application/pdf", "image/png", "image/jpeg"}
if file.content_type not in allowed:
raise HTTPException(status_code=415, detail=f"Unsupported type: {file.content_type}")


# Read a small chunk to verify we received bytes (demo only)
head = await file.read(512)
if not head:
raise HTTPException(status_code=400, detail="Empty file upload")


# TODO: Replace this with real OCR / parsing logic
payload = {
"invoice_date": "2025-10-01",
"invoice_amount": "1234.56",
"btw_amount": "214.56",
"btw_number": "NL123456789B01",
"kvk": "87654321",
"supplier": "Xavora BV",
"notes": f"Auto-extracted from {file.filename}",
}
return JSONResponse(payload)


# Root serves your SPA entry
@app.get("/")
async def root():
index_path = os.path.join(STATIC_DIR, "index.html")
return FileResponse(index_path)


# Optional: support client-side routing (if you add it later)
@app.get("/{full_path:path}")
async def spa_fallback(full_path: str):
index_path = os.path.join(STATIC_DIR, "index.html")
if os.path.exists(os.path.join(STATIC_DIR, full_path)):
# If it’s a real file under /static, serve it
return FileResponse(os.path.join(STATIC_DIR, full_path))
return FileResponse(index_path)


if __name__ == "__main__":
# Local dev convenience run: `python main.py`
import uvicorn
port = int(os.environ.get("PORT", 8000))
uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
