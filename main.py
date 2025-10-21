import os
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse

APP_ROOT = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(APP_ROOT, "static")

app = FastAPI(title="Invoice Extractor")

# Same-origin in Azure; keep CORS permissive for now (lock down later if needed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve the frontend
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/extract")
async def extract(file: UploadFile = File(...)):
    allowed = {"application/pdf", "image/png", "image/jpeg"}
    if file.content_type not in allowed:
        raise HTTPException(status_code=415, detail=f"Unsupported type: {file.content_type}")

    # Stub: read a small chunk just to verify bytes arrived
    head = await file.read(512)
    if not head:
        raise HTTPException(status_code=400, detail="Empty file upload")

    # Return demo data (replace with real logic later)
    return JSONResponse({
        "invoice_date": "2025-10-01",
        "invoice_amount": "1234.56",
        "btw_amount": "214.56",
        "btw_number": "NL123456789B01",
        "kvk": "87654321",
        "supplier": "Xavora BV",
        "notes": f"Auto-extracted from {file.filename}",
    })

# Root -> SPA entry
@app.get("/")
async def root():
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))

# Optional: fallback for client-routing (serves index if path isn't a real file)
@app.get("/{full_path:path}")
async def spa_fallback(full_path: str):
    p = os.path.join(STATIC_DIR, full_path)
    return FileResponse(p) if os.path.exists(p) else FileResponse(os.path.join(STATIC_DIR, "index.html"))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.environ.get("PORT", 8000)), reload=True)
