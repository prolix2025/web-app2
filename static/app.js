// ===== Backend URL =====
const API_BASE = ""; // same-origin; backend and frontend are served together;
// ===== Clock =====
const clockEl = document.getElementById('clock');
function tick() {
  const d = new Date();
  clockEl.textContent = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
if (clockEl) { tick(); setInterval(tick, 1000 * 15); }

// ===== Elements =====
const dropzone   = document.getElementById('dropzone');
const fileInput  = document.getElementById('file');
const preview    = document.getElementById('preview');
const imgPreview = document.getElementById('imgPreview');
const pdfPreview = document.getElementById('pdfPreview');
const placeholder = document.getElementById('placeholder');

const form      = document.getElementById('detailsForm');
const btnExtract = document.getElementById('btn1'); // Left panel button 1
const btnClear   = document.getElementById('btn2'); // Left panel button 2
const btnSaveDraft = document.getElementById('saveDraft');

// ===== Preview helpers =====
function showPreview(file) {
  const url = URL.createObjectURL(file);
  const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

  imgPreview.style.display = isPDF ? 'none' : 'block';
  pdfPreview.style.display = isPDF ? 'block' : 'none';

  if (isPDF) {
    // PDFs: fill the dotted area
    pdfPreview.src = url;
  } else {
    // Images: contain within the dotted area
    imgPreview.src = url;
  }

  preview.classList.add('active');
  placeholder.style.display = 'none';
}

function clearPreview() {
  if (fileInput) fileInput.value = '';
  imgPreview.removeAttribute('src');
  pdfPreview.removeAttribute('src');
  preview.classList.remove('active');
  placeholder.style.display = '';
}

// ===== Drag & drop + file input =====
if (dropzone) {
  dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('drag'); });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag'));
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault(); dropzone.classList.remove('drag');
    const file = e.dataTransfer.files?.[0];
    if (file) { fileInput.files = e.dataTransfer.files; showPreview(file); }
  });
  dropzone.addEventListener('click', () => fileInput.click());
}

if (fileInput) {
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (file) showPreview(file);
  });
}

// ===== Left control panel actions =====
if (btnClear) btnClear.addEventListener('click', clearPreview);

if (btnExtract) btnExtract.addEventListener('click', async () => {
  const file = fileInput?.files?.[0];
  if (!file) { alert('Please upload an invoice first.'); return; }

  try {
    // Disable buttons while working (optional)
    btnExtract.disabled = true; btnExtract.textContent = "Extracting…";

    const formData = new FormData();
    formData.append('file', file, file.name);

    const res = await fetch(`${API_BASE}/extract`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Backend error ${res.status}: ${text}`);
    }

    const data = await res.json();
    hydrateForm(data); // already defined in your app.js

    // Optional: give quick feedback
    console.log('Extracted fields:', data);
  } catch (err) {
    console.error(err);
    alert("Extraction failed. Check console for details.");
  } finally {
    btnExtract.disabled = false; btnExtract.textContent = "Extract with AI";
  }
});

function hydrateForm(data) {
  if (!data || !form) return;
  const map = {
    invoice_date: data.invoice_date,
    invoice_amount: data.invoice_amount,
    btw_amount: data.btw_amount,
    btw_number: data.btw_number,
    kvk: data.kvk,
    supplier: data.supplier,
    notes: data.notes
  };
  Object.entries(map).forEach(([k, v]) => {
    if (v == null) return;
    const el = form.elements.namedItem(k);
    if (el) el.value = v;
  });
}

// ===== Draft save/restore =====
if (btnSaveDraft && form) {
  btnSaveDraft.addEventListener('click', () => {
    localStorage.setItem('invoiceFormDraft', JSON.stringify(Object.fromEntries(new FormData(form))));
  });
}

if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const payload = Object.fromEntries(new FormData(form));
    console.log('Submit payload', payload);
  });

  // Restore draft if present
  const draft = localStorage.getItem('invoiceFormDraft');
  if (draft) {
    try {
      const data = JSON.parse(draft);
      Object.entries(data).forEach(([k, v]) => {
        const el = form.querySelector(`[name="${k}"]`);
        if (el) el.value = v;
      });
    } catch {}
  }
}
