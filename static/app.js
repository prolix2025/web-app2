/* ===== Config ===== */
const API_BASE = ""; // same-origin; use relative paths like '/extract'
const DRAFT_KEY = "invoiceFormDraft_v2";

/* ===== DOM ===== */
const els = {
  clock: document.getElementById("clock"),
  year: document.getElementById("year"),
  status: document.getElementById("status"),

  dropzone: document.getElementById("dropzone"),
  fileInput: document.getElementById("file-input"),
  dzPlaceholder: document.getElementById("dz-placeholder"),
  preview: document.getElementById("preview"),
  imgPreview: document.getElementById("img-preview"),
  pdfPreview: document.getElementById("pdf-preview"),

  form: document.getElementById("details-form"),
  btnExtract: document.getElementById("btn-extract"),
  btnClear: document.getElementById("btn-clear"),
  btnSaveDraft: document.getElementById("btn-save-draft"),
  btnLoadDraft: document.getElementById("btn-load-draft"),
  btnClearDraft: document.getElementById("btn-clear-draft"),

  toastTpl: document.getElementById("toast-template"),
};

let currentObjectUrl = null;

/* ===== Utils ===== */
function setStatus(msg, isError = false) {
  els.status.textContent = msg || "";
  els.status.style.color = isError ? "#fca5a5" : "#cfd6df";
}

function showToast(text) {
  const node = els.toastTpl.content.firstElementChild.cloneNode(true);
  node.textContent = text;
  document.body.appendChild(node);
  setTimeout(() => node.remove(), 2500);
}

function revokePreviewUrl() {
  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = null;
  }
}

function isAllowedFile(file) {
  const ok = ["application/pdf", "image/png", "image/jpeg"];
  return file && ok.includes(file.type);
}

/* ===== Clock ===== */
function updateClock() {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  els.clock.textContent = `${hh}:${mm}`;
}
function initClock() {
  updateClock();
  setInterval(updateClock, 15_000);
  els.year.textContent = String(new Date().getFullYear());
}

/* ===== Preview ===== */
function showPreview(file) {
  revokePreviewUrl();
  const url = URL.createObjectURL(file);
  currentObjectUrl = url;

  els.dzPlaceholder.hidden = true;
  els.preview.hidden = false;

  if (file.type === "application/pdf") {
    els.imgPreview.hidden = true;
    els.pdfPreview.hidden = false;
    els.pdfPreview.src = url;
    els.pdfPreview.type = "application/pdf";
  } else {
    els.pdfPreview.hidden = true;
    els.imgPreview.hidden = false;
    els.imgPreview.src = url;
    els.imgPreview.alt = `Preview of ${file.name}`;
  }
}

function clearPreview() {
  revokePreviewUrl();
  els.preview.hidden = true;
  els.imgPreview.hidden = true;
  els.pdfPreview.hidden = true;
  els.imgPreview.removeAttribute("src");
  els.pdfPreview.removeAttribute("src");
  els.dzPlaceholder.hidden = false;
}

/* ===== Drafts ===== */
function saveDraft() {
  const data = Object.fromEntries(new FormData(els.form).entries());
  localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
  showToast("Draft saved");
}
function loadDraft() {
  const raw = localStorage.getItem(DRAFT_KEY);
  if (!raw) { showToast("No draft found"); return; }
  const data = JSON.parse(raw);
  for (const [k, v] of Object.entries(data)) {
    const el = els.form.elements.namedItem(k);
    if (el) el.value = v;
  }
  showToast("Draft loaded");
}
function clearDraft() {
  localStorage.removeItem(DRAFT_KEY);
  showToast("Draft cleared");
}

/* ===== Upload / Extract ===== */
async function extract() {
  const file = els.fileInput.files?.[0];
  if (!file) {
    setStatus("Please select a file first.", true);
    showToast("No file selected");
    return;
  }
  if (!isAllowedFile(file)) {
    setStatus(`Unsupported type: ${file.type || "unknown"}`, true);
    showToast("Only PDF, PNG, JPG are supported");
    return;
  }

  const formData = new FormData();
  formData.append("file", file, file.name);

  els.btnExtract.disabled = true;
  setStatus("Uploading…");
  try {
    const res = await fetch(`${API_BASE}/extract`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`Server responded ${res.status}: ${txt || res.statusText}`);
    }

    const json = await res.json();

    // Map fields if present
    const map = [
      "invoice_date",
      "invoice_amount",
      "btw_amount",
      "btw_number",
      "kvk",
      "supplier",
      "notes",
    ];
    for (const key of map) {
      if (key in json) {
        const el = els.form.elements.namedItem(key);
        if (el) el.value = json[key] ?? "";
      }
    }

    setStatus("Extraction complete.");
    showToast("Fields filled from extraction");
  } catch (err) {
    console.error(err);
    setStatus(String(err.message || err), true);
    showToast("Extraction failed");
  } finally {
    els.btnExtract.disabled = false;
  }
}

/* ===== Clear ===== */
function clearAll() {
  els.form.reset();
  clearPreview();
  setStatus("Cleared.");
}

/* ===== Dropzone wiring ===== */
function wireDropzone() {
  const dz = els.dropzone;

  dz.addEventListener("click", () => els.fileInput.click());
  dz.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      els.fileInput.click();
    }
  });

  ["dragenter", "dragover"].forEach((ev) =>
    dz.addEventListener(ev, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dz.classList.add("dragover");
    })
  );
  ["dragleave", "drop"].forEach((ev) =>
    dz.addEventListener(ev, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dz.classList.remove("dragover");
    })
  );

  dz.addEventListener("drop", (e) => {
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    if (!isAllowedFile(file)) {
      setStatus("Unsupported file type.", true);
      showToast("Only PDF, PNG, JPG are supported");
      return;
    }
    els.fileInput.files = e.dataTransfer.files; // keep it in input
    showPreview(file);
    setStatus(`Loaded: ${file.name}`);
  });

  els.fileInput.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isAllowedFile(file)) {
      setStatus("Unsupported file type.", true);
      showToast("Only PDF, PNG, JPG are supported");
      els.fileInput.value = "";
      return;
    }
    showPreview(file);
    setStatus(`Loaded: ${file.name}`);
  });
}

/* ===== Init ===== */
function init() {
  initClock();
  wireDropzone();

  els.btnExtract.addEventListener("click", extract);
  els.btnClear.addEventListener("click", clearAll);

  els.btnSaveDraft.addEventListener("click", saveDraft);
  els.btnLoadDraft.addEventListener("click", loadDraft);
  els.btnClearDraft.addEventListener("click", clearDraft);
}

document.addEventListener("DOMContentLoaded", init);
