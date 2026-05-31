// State Aplikasi
const appState = {
  currentStep: 1,
  selectedTemplate: '2-landscape', // default template (2-portrait dihilangkan sesuai gambar)
  photos: {}, // Menyimpan base64 dataURL untuk setiap slot foto {0: 'data:image/...', 1: 'data:image/...'}
  photoCaptions: {}, // Menyimpan keterangan kustom untuk tiap slot foto
  photoTransforms: {}, // Menyimpan data geser dan perbesar { 0: { x: 0, y: 0, scale: 1 }, 1: ... }
  pdfPhotoFit: 'cover', // Gaya tampilan foto: 'cover' atau 'contain'
  pdfPhotoSize: 'normal', // Tinggi area foto: 'normal', 'compact', atau 'large'
  coordinates: null, // { lat: ..., lng: ... }
  address: ''
};

// DOM Elements
const elements = {
  kegiatanNama: document.getElementById('kegiatan-nama'),
  kegiatanTanggal: document.getElementById('kegiatan-tanggal'),
  kegiatanWaktu: document.getElementById('kegiatan-waktu'),
  kegiatanAlamat: document.getElementById('kegiatan-alamat'),
  kegiatanCatatan: document.getElementById('kegiatan-catatan'),
  btnGps: document.getElementById('btn-gps'),
  gpsStatus: document.getElementById('gps-status'),
  coordsContainer: document.getElementById('coords-container'),
  latVal: document.getElementById('lat-val'),
  lngVal: document.getElementById('lng-val'),
  photoUploadContainer: document.getElementById('photo-upload-container'),
  loadingOverlay: document.getElementById('loading-overlay'),
  loadingText: document.getElementById('loading-text'),
  
  // PDF Settings Elements
  pdfPhotoFit: document.getElementById('pdf-photo-fit'),
  pdfPhotoSize: document.getElementById('pdf-photo-size'),
  
  // PDF Preview Elements
  pdfValKegiatan: document.getElementById('pdf-val-kegiatan'),
  pdfValTanggal: document.getElementById('pdf-val-tanggal'),
  pdfValAlamat: document.getElementById('pdf-val-alamat'),
  pdfValCatatan: document.getElementById('pdf-val-catatan'),
  pdfValKoordinat: document.getElementById('pdf-val-koordinat'),
  pdfRowCoords: document.getElementById('pdf-row-coords'),
  pdfPhotosGridRender: document.getElementById('pdf-photos-grid-render'),
  pdfCurrentTimestamp: document.getElementById('pdf-current-timestamp'),
  
  // Action Buttons
  btnGeneratePdf: document.getElementById('btn-generate-pdf'),
  btnShareWa: document.getElementById('btn-share-wa')
};

// Inisialisasi Aplikasi saat dokumen siap
document.addEventListener('DOMContentLoaded', () => {
  initDateTime();
  initEventListeners();
  initTemplates();
  renderPhotoSlots();
  initVoiceInput();
});

// 1. Inisialisasi Tanggal & Waktu Otomatis
function initDateTime() {
  const now = new Date();
  
  // Format Date YYYY-MM-DD untuk input date
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const date = String(now.getDate()).padStart(2, '0');
  elements.kegiatanTanggal.value = `${year}-${month}-${date}`;
  
  // Format Time HH:MM untuk input time
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  elements.kegiatanWaktu.value = `${hours}:${minutes}`;
}

// 2. Event Listeners
function initEventListeners() {
  // Tombol GPS
  elements.btnGps.addEventListener('click', handleGPSDetection);
  
  // Tombol Aksi Akhir
  elements.btnGeneratePdf.addEventListener('click', generatePDFReport);
  elements.btnShareWa.addEventListener('click', shareToWhatsApp);

  // Event listener untuk pengaturan tampilan PDF
  if (elements.pdfPhotoFit) {
    elements.pdfPhotoFit.addEventListener('change', (e) => {
      appState.pdfPhotoFit = e.target.value;
      preparePDFPreview();
    });
  }

  if (elements.pdfPhotoSize) {
    elements.pdfPhotoSize.addEventListener('change', (e) => {
      appState.pdfPhotoSize = e.target.value;
      preparePDFPreview();
    });
  }
}

// 3. Deteksi GPS & Reverse Geocoding
function handleGPSDetection() {
  if (!navigator.geolocation) {
    alert("Maaf, browser Anda tidak mendukung deteksi lokasi (GPS).");
    return;
  }
  
  elements.gpsStatus.classList.remove('hidden');
  elements.coordsContainer.classList.add('hidden');
  elements.btnGps.disabled = true;
  
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      
      appState.coordinates = { lat, lng };
      
      // Update UI Tampilan Koordinat
      elements.latVal.textContent = lat.toFixed(6);
      elements.lngVal.textContent = lng.toFixed(6);
      elements.coordsContainer.classList.remove('hidden');
      
      elements.gpsStatus.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mencari alamat jalan...';
      
      try {
        // Reverse Geocoding menggunakan OpenStreetMap Nominatim API (Gratis)
        // Menambahkan User-Agent header sesuai dengan kebijakan penggunaan Nominatim
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
          headers: {
            'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          const displayName = data.display_name;
          
          if (displayName) {
            elements.kegiatanAlamat.value = displayName;
            appState.address = displayName;
          } else {
            elements.kegiatanAlamat.value = `Koordinat: ${lat}, ${lng}`;
            appState.address = `Koordinat: ${lat}, ${lng}`;
          }
        } else {
          throw new Error("Gagal mengambil data alamat");
        }
      } catch (error) {
        console.error("Error geocoding:", error);
        // Fallback jika API bermasalah atau limit
        elements.kegiatanAlamat.value = `Koordinat: ${lat}, ${lng}\n(Gagal mendapatkan alamat otomatis. Silakan masukkan alamat manual jika diperlukan)`;
        appState.address = `Koordinat: ${lat}, ${lng}`;
      } finally {
        elements.gpsStatus.classList.add('hidden');
        elements.btnGps.disabled = false;
        // Kembalikan teks asli spinner untuk pencarian berikutnya
        elements.gpsStatus.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mendapatkan koordinat...';
      }
    },
    (error) => {
      console.error("Error GPS:", error);
      elements.gpsStatus.classList.add('hidden');
      elements.btnGps.disabled = false;
      
      let errorMsg = "Gagal mendeteksi lokasi. ";
      switch(error.code) {
        case error.PERMISSION_DENIED:
          errorMsg += "Izin GPS ditolak oleh pengguna.";
          break;
        case error.POSITION_UNAVAILABLE:
          errorMsg += "Informasi lokasi tidak tersedia.";
          break;
        case error.TIMEOUT:
          errorMsg += "Waktu permintaan lokasi habis.";
          break;
        default:
          errorMsg += "Terjadi kesalahan tidak dikenal.";
      }
      alert(errorMsg);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
}

// 4. Inisialisasi Pilihan Template Foto
function initTemplates() {
  const cards = document.querySelectorAll('.template-card');
  cards.forEach(card => {
    // Tandai template default di UI
    if (card.dataset.template === appState.selectedTemplate) {
      card.classList.add('selected');
    }
    
    card.addEventListener('click', () => {
      // Hapus pilihan sebelumnya
      cards.forEach(c => c.classList.remove('selected'));
      // Pilih yang diklik
      card.classList.add('selected');
      appState.selectedTemplate = card.dataset.template;
      
      // Reset foto karena template berganti susunan
      appState.photos = {};
      appState.photoCaptions = {}; // Reset caption kustom
      appState.photoTransforms = {}; // Reset transform
      
      // Render ulang slot foto di Step 3
      renderPhotoSlots();
    });
  });
}

// 5. Render Slot Foto Sesuai Template
function renderPhotoSlots() {
  elements.photoUploadContainer.innerHTML = '';
  
  // Atur kelas grid unggahan agar sesuai dengan template yang dipilih
  elements.photoUploadContainer.className = `photo-upload-grid upload-grid-${appState.selectedTemplate}`;
  
  // Konfigurasi Slot Foto berdasarkan Template
  let slots = [];
  
  switch (appState.selectedTemplate) {
    case '2-landscape':
      slots = [
        { id: 0, label: 'Foto 1 (Landscape)', isPortrait: false, defaultCaption: 'Foto Dokumentasi 1' },
        { id: 1, label: 'Foto 2 (Landscape)', isPortrait: false, defaultCaption: 'Foto Dokumentasi 2' }
      ];
      break;
    case '3-landscape':
      slots = [
        { id: 0, label: 'Foto 1 (Landscape)', isPortrait: false, defaultCaption: 'Foto Dokumentasi 1' },
        { id: 1, label: 'Foto 2 (Landscape)', isPortrait: false, defaultCaption: 'Foto Dokumentasi 2' },
        { id: 2, label: 'Foto 3 (Landscape)', isPortrait: false, defaultCaption: 'Foto Dokumentasi 3' }
      ];
      break;
    case '3-mix':
      slots = [
        { id: 0, label: 'Foto 1 (Portrait)', isPortrait: true, defaultCaption: 'Foto Dokumentasi 1 (Portrait)' },
        { id: 1, label: 'Foto 2 (Portrait)', isPortrait: true, defaultCaption: 'Foto Dokumentasi 2 (Portrait)' },
        { id: 2, label: 'Foto 3 (Landscape)', isPortrait: false, defaultCaption: 'Foto Dokumentasi 3 (Landscape)' }
      ];
      break;
    case '4-portrait':
      slots = [
        { id: 0, label: 'Foto 1 (Portrait)', isPortrait: true, defaultCaption: 'Foto Dokumentasi 1' },
        { id: 1, label: 'Foto 2 (Portrait)', isPortrait: true, defaultCaption: 'Foto Dokumentasi 2' },
        { id: 2, label: 'Foto 3 (Portrait)', isPortrait: true, defaultCaption: 'Foto Dokumentasi 3' },
        { id: 3, label: 'Foto 4 (Portrait)', isPortrait: true, defaultCaption: 'Foto Dokumentasi 4' }
      ];
      break;
  }
  
  slots.forEach(slot => {
    // Wrapper item foto
    const wrapperEl = document.createElement('div');
    wrapperEl.className = 'photo-slot-wrapper';
    
    // Slot input foto
    const slotEl = document.createElement('div');
    slotEl.className = `photo-slot ${slot.isPortrait ? 'portrait-slot' : ''}`;
    slotEl.dataset.slotId = slot.id;
    
    // Tampilan default placeholder kosong
    slotEl.innerHTML = `
      <div class="photo-slot-placeholder">
        <i class="fa-solid fa-camera-retro"></i>
        <span>${slot.label}</span>
        <p>Klik untuk mengambil foto atau memilih berkas</p>
      </div>
      <input type="file" accept="image/*" class="hidden file-input">
    `;
    
    // Event listener untuk memicu input file saat slot diklik
    slotEl.addEventListener('click', (e) => {
      // Jika sudah ada gambar, klik tidak boleh membuka file picker, gunakan tombol ubah di overlay
      if (appState.photos[slot.id]) return;
      if (e.target.closest('.photo-overlay-btn')) return;
      
      const fileInput = slotEl.querySelector('.file-input');
      fileInput.click();
    });
    
    // Event listener untuk menangani file gambar yang masuk
    const fileInput = slotEl.querySelector('.file-input');
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        processImageFile(file, slot.id, slotEl);
      }
    });
    
    // Group kontrol zoom & keterangan
    const controlsGroup = document.createElement('div');
    controlsGroup.className = 'photo-controls-group';
    
    const transform = appState.photoTransforms[slot.id] || { x: 0, y: 0, scale: 1.0 };
    appState.photoTransforms[slot.id] = transform;
    
    const savedCaption = appState.photoCaptions[slot.id] || '';
    
    controlsGroup.innerHTML = `
      <div class="zoom-control-row">
        <i class="fa-solid fa-magnifying-glass-minus zoom-icon"></i>
        <input type="range" class="zoom-range-input" min="1.0" max="3.0" step="0.05" value="${transform.scale}">
        <i class="fa-solid fa-magnifying-glass-plus zoom-icon"></i>
      </div>
      <div class="photo-caption-group">
        <label class="caption-label" for="caption-${slot.id}">
          <i class="fa-solid fa-pen-to-square"></i> Keterangan Foto (Opsional)
        </label>
        <input type="text" id="caption-${slot.id}" class="photo-caption-input" 
               placeholder="Contoh: ${slot.defaultCaption} - Kondisi di lapangan" 
               value="${savedCaption}">
      </div>
    `;
    
    // Zoom Range Handler
    const zoomRangeInput = controlsGroup.querySelector('.zoom-range-input');
    zoomRangeInput.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      transform.scale = val;
      appState.photoTransforms[slot.id] = transform;
      
      const img = slotEl.querySelector('.photo-preview-img');
      if (img) {
        img.style.transform = `translate(${transform.x}px, ${transform.y}px) scale(${val})`;
      }
      preparePDFPreview();
    });
    
    // Simpan keterangan ke state saat diketik
    const captionInput = controlsGroup.querySelector('.photo-caption-input');
    captionInput.addEventListener('input', (e) => {
      appState.photoCaptions[slot.id] = e.target.value.trim();
      preparePDFPreview();
    });
    
    wrapperEl.appendChild(slotEl);
    wrapperEl.appendChild(controlsGroup);
    elements.photoUploadContainer.appendChild(wrapperEl);
    
    // Jika foto sudah pernah diunggah sebelumnya (misal kembali dari step lain)
    if (appState.photos[slot.id]) {
      updateSlotPreviewUI(slotEl, slot.id, appState.photos[slot.id]);
      attachDragHandlers(slotEl, slot.id);
    }
  });
}

// 6. Memproses File Gambar
function processImageFile(file, slotId, slotEl) {
  // Validasi tipe file
  if (!file.type.startsWith('image/')) {
    alert("Berkas yang dipilih harus berupa gambar.");
    return;
  }
  
  showLoading("Mengompres & memuat gambar...");
  
  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.src = event.target.result;
    
    img.onload = () => {
      // Mengompres gambar agar ukuran file PDF tidak terlalu besar di browser mobile
      const canvas = document.createElement('canvas');
      const maxDim = 1200; // resolusi maksimal gambar
      let width = img.width;
      let height = img.height;
      
      if (width > height) {
        if (width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        }
      } else {
        if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      
      // Simpan sebagai JPEG dengan kualitas 0.8
      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      
      // Simpan di State & Inisialisasi transform default
      appState.photos[slotId] = compressedDataUrl;
      appState.photoTransforms[slotId] = { x: 0, y: 0, scale: 1.0 };
      
      // Tampilkan Preview di Slot UI
      updateSlotPreviewUI(slotEl, slotId, compressedDataUrl);
      attachDragHandlers(slotEl, slotId);
      
      hideLoading();
    };
  };
  
  reader.readAsDataURL(file);
}

// 7. Update UI Slot Foto dengan Preview Gambar
function updateSlotPreviewUI(slotEl, slotId, dataUrl) {
  // Hapus isi placeholder lama
  const placeholder = slotEl.querySelector('.photo-slot-placeholder');
  if (placeholder) placeholder.classList.add('hidden');
  
  // Bersihkan preview lama jika ada
  const oldImg = slotEl.querySelector('.photo-preview-img');
  if (oldImg) oldImg.remove();
  const oldOverlay = slotEl.querySelector('.photo-overlay');
  if (oldOverlay) oldOverlay.remove();
  
  // Buat preview gambar
  const imgEl = document.createElement('img');
  imgEl.src = dataUrl;
  imgEl.className = 'photo-preview-img';
  imgEl.style.position = 'absolute';
  imgEl.style.top = '0';
  imgEl.style.left = '0';
  imgEl.style.width = '100%';
  imgEl.style.height = '100%';
  imgEl.style.objectFit = 'cover';
  slotEl.appendChild(imgEl);
  
  // Buat overlay aksi (Ubah / Hapus)
  const overlayEl = document.createElement('div');
  overlayEl.className = 'photo-overlay';
  overlayEl.innerHTML = `
    <button type="button" class="photo-overlay-btn btn-change" title="Ubah Foto">
      <i class="fa-solid fa-arrows-rotate"></i>
    </button>
    <button type="button" class="photo-overlay-btn btn-delete" title="Hapus Foto">
      <i class="fa-solid fa-trash-can"></i>
    </button>
  `;
  
  // Listener untuk Ubah Foto
  overlayEl.querySelector('.btn-change').addEventListener('click', (e) => {
    e.stopPropagation();
    slotEl.querySelector('.file-input').click();
  });
  
  // Listener untuk Hapus Foto
  overlayEl.querySelector('.btn-delete').addEventListener('click', (e) => {
    e.stopPropagation();
    deletePhoto(slotId, slotEl);
  });
  
  slotEl.appendChild(overlayEl);
}

// Pasang Handlers untuk geser (drag & pan) gambar
function attachDragHandlers(slotEl, slotId) {
  const img = slotEl.querySelector('.photo-preview-img');
  if (!img) return;
  
  const transform = appState.photoTransforms[slotId] || { x: 0, y: 0, scale: 1.0 };
  
  // Terapkan style awal
  img.style.transform = `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`;
  img.style.transformOrigin = 'center';
  img.style.cursor = 'grab';
  
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let translateX = transform.x;
  let translateY = transform.y;
  
  function startDrag(e) {
    if (e.target.closest('.photo-overlay-btn')) return;
    isDragging = true;
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    startX = clientX - translateX;
    startY = clientY - translateY;
    
    img.style.cursor = 'grabbing';
  }
  
  function drag(e) {
    if (!isDragging) return;
    // Cegah web scroll saat drag foto di mobile
    e.preventDefault();
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    translateX = clientX - startX;
    translateY = clientY - startY;
    
    img.style.transform = `translate(${translateX}px, ${translateY}px) scale(${transform.scale})`;
  }
  
  function endDrag() {
    if (!isDragging) return;
    isDragging = false;
    img.style.cursor = 'grab';
    
    // Simpan koordinat baru ke state
    transform.x = translateX;
    transform.y = translateY;
    appState.photoTransforms[slotId] = transform;
    
    // Perbarui pratinjau PDF di latar belakang
    preparePDFPreview();
  }
  
  // Tambah mouse & touch events
  img.addEventListener('mousedown', startDrag);
  img.addEventListener('touchstart', startDrag, { passive: false });
  
  img.addEventListener('mousemove', drag);
  img.addEventListener('touchmove', drag, { passive: false });
  
  img.addEventListener('mouseup', endDrag);
  img.addEventListener('mouseleave', endDrag);
  img.addEventListener('touchend', endDrag);
}

// Hapus Foto dari Slot
function deletePhoto(slotId, slotEl) {
  delete appState.photos[slotId];
  delete appState.photoTransforms[slotId];
  
  // Kembalikan tampilan ke placeholder kosong
  const placeholder = slotEl.querySelector('.photo-slot-placeholder');
  if (placeholder) placeholder.classList.remove('hidden');
  
  const img = slotEl.querySelector('.photo-preview-img');
  if (img) img.remove();
  
  const overlay = slotEl.querySelector('.photo-overlay');
  if (overlay) overlay.remove();
  
  // Reset input file agar jika memilih berkas yang sama, event change tetap terpicu
  const fileInput = slotEl.querySelector('.file-input');
  fileInput.value = '';
  
  // Update pratinjau PDF
  preparePDFPreview();
}

// 8. Logika Navigasi Wizard Steps
function navigateToStep(stepNumber) {
  // Hanya ijinkan pindah jika melompati langkah yang sudah valid
  if (stepNumber > appState.currentStep) {
    // Jika ingin melompat maju, pastikan validasi langkah saat ini lolos terlebih dahulu
    if (!validateStep(appState.currentStep)) return;
  }
  
  goToStep(stepNumber);
}

function nextStep(currentStepNumber) {
  if (validateStep(currentStepNumber)) {
    goToStep(currentStepNumber + 1);
  }
}

function prevStep(currentStepNumber) {
  goToStep(currentStepNumber - 1);
}

function validateStep(stepNumber) {
  if (stepNumber === 1) {
    const nama = elements.kegiatanNama.value.trim();
    if (!nama) {
      alert("Silakan masukkan Nama Kegiatan terlebih dahulu.");
      elements.kegiatanNama.focus();
      return false;
    }
  }
  
  if (stepNumber === 3) {
    // Validasi opsional: apakah minimal satu foto harus diunggah?
    // Mari kita ingatkan user jika belum ada foto sama sekali, tapi tetap boleh lanjut
    const totalPhotos = Object.keys(appState.photos).length;
    if (totalPhotos === 0) {
      const confirmProceed = confirm("Anda belum menambahkan foto dokumentasi. Lanjutkan untuk melihat pratinjau?");
      return confirmProceed;
    }
  }
  
  return true;
}

function goToStep(stepNumber) {
  // Sembunyikan langkah saat ini
  document.getElementById(`step-${appState.currentStep}`).classList.remove('active');
  
  // Perbarui state langkah
  appState.currentStep = stepNumber;
  
  // Tampilkan langkah tujuan
  document.getElementById(`step-${stepNumber}`).classList.add('active');
  
  // Perbarui UI Step Indicator
  updateStepIndicatorUI();
  
  // Jika berpindah ke Step 3, pastikan slot ter-render dengan state terbaru
  if (stepNumber === 3) {
    renderPhotoSlots();
  }

  // Jika berpindah ke Step 4 (Pratinjau), siapkan layout kertas A4
  if (stepNumber === 4) {
    preparePDFPreview();
  }
  
  // Scroll halaman ke atas agar user nyaman
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateStepIndicatorUI() {
  for (let i = 1; i <= 4; i++) {
    const dot = document.getElementById(`step-dot-${i}`);
    const line = document.getElementById(`step-line-${i}`);
    
    // Update Dot & Line Class di desktop jika ada
    if (dot) {
      dot.classList.remove('active', 'completed');
      if (i === appState.currentStep) {
        dot.classList.add('active');
      } else if (i < appState.currentStep) {
        dot.classList.add('completed');
      }
    }
    
    if (line) {
      line.classList.remove('active', 'completed');
      if (i < appState.currentStep) {
        line.classList.add('completed');
      } else if (i === appState.currentStep - 1) {
        line.classList.add('active');
      }
    }
    
    // Update mobile bottom nav
    const mobileNavItem = document.getElementById(`mobile-nav-${i}`);
    if (mobileNavItem) {
      mobileNavItem.classList.remove('active');
      if (i === appState.currentStep) {
        mobileNavItem.classList.add('active');
      }
    }
  }
}

// 9. Siapkan Pratinjau Lembar PDF A4 (Step 4)
function preparePDFPreview() {
  // Ambil data terbaru dari form input
  const nama = elements.kegiatanNama.value.trim() || 'Belum diisi';
  const tanggalInput = elements.kegiatanTanggal.value;
  const waktuInput = elements.kegiatanWaktu.value;
  const alamat = elements.kegiatanAlamat.value.trim() || 'Belum diisi';
  const catatan = elements.kegiatanCatatan.value.trim() || 'Tidak ada catatan';
  
  // Format Tanggal yang lebih bersahabat (misal: Minggu, 31 Mei 2026)
  let tanggalFormatted = 'Belum diisi';
  if (tanggalInput) {
    const dateObj = new Date(tanggalInput);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    tanggalFormatted = dateObj.toLocaleDateString('id-ID', options);
    if (waktuInput) {
      tanggalFormatted += ` pukul ${waktuInput} WIB`;
    }
  }
  
  // Isi data ke pratinjau PDF
  elements.pdfValKegiatan.textContent = nama;
  elements.pdfValTanggal.textContent = tanggalFormatted;
  elements.pdfValAlamat.textContent = alamat;
  elements.pdfValCatatan.textContent = catatan;
  
  // Koordinat GPS
  if (appState.coordinates) {
    elements.pdfRowCoords.style.display = 'flex';
    elements.pdfValKoordinat.textContent = `Lat: ${appState.coordinates.lat.toFixed(6)}, Lng: ${appState.coordinates.lng.toFixed(6)}`;
  } else {
    elements.pdfRowCoords.style.display = 'none';
  }
  
  // Timestamp pembuatan PDF
  const now = new Date();
  const formatTimestamp = now.toLocaleDateString('id-ID', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  }) + ' WIB';
  elements.pdfCurrentTimestamp.textContent = formatTimestamp;
  
  // Render layout foto pada pratinjau PDF
  renderPDFPhotosLayout();
}

function renderPDFPhotosLayout() {
  const container = elements.pdfPhotosGridRender;
  container.innerHTML = '';
  
  // Ambil template aktif
  const t = appState.selectedTemplate;
  
  // Reset & Terapkan CSS kelas ke container
  container.className = 'pdf-photos-grid';
  container.classList.add(`pdf-grid-${t}`);
  
  // Terapkan kelas ukuran tinggi grid (normal, compact, large)
  const sizeClass = appState.pdfPhotoSize || 'normal';
  container.classList.add(`size-${sizeClass}`);
  
  // Jumlah foto yang harus dirender
  let photoCount = 2;
  let defaultLabels = [];
  let isPortraitList = [];
  
  if (t === '2-landscape') {
    photoCount = 2;
    defaultLabels = ['Foto Dokumentasi 1', 'Foto Dokumentasi 2'];
    isPortraitList = [false, false];
  } else if (t === '3-landscape') {
    photoCount = 3;
    defaultLabels = ['Foto Dokumentasi 1', 'Foto Dokumentasi 2', 'Foto Dokumentasi 3'];
    isPortraitList = [false, false, false];
  } else if (t === '3-mix') {
    photoCount = 3;
    defaultLabels = ['Foto Dokumentasi 1', 'Foto Dokumentasi 2', 'Foto Dokumentasi 3'];
    isPortraitList = [true, true, false]; // portrait, portrait, landscape
  } else if (t === '4-portrait') {
    photoCount = 4;
    defaultLabels = ['Foto Dokumentasi 1', 'Foto Dokumentasi 2', 'Foto Dokumentasi 3', 'Foto Dokumentasi 4'];
    isPortraitList = [true, true, true, true];
  }
  
  // Rendering untuk template khusus (3-mix) yang memiliki struktur sub-grid
  if (t === '3-mix') {
    // 1. Render Row Atas (2 Foto Portrait kecil berdampingan)
    const topRow = document.createElement('div');
    topRow.className = 'pdf-grid-3-toprow';
    
    const caption1 = appState.photoCaptions[0] || defaultLabels[0];
    const caption2 = appState.photoCaptions[1] || defaultLabels[1];
    
    const box1 = createPDFPhotoBox(0, caption1, isPortraitList[0]);
    const box2 = createPDFPhotoBox(1, caption2, isPortraitList[1]);
    
    topRow.appendChild(box1);
    topRow.appendChild(box2);
    container.appendChild(topRow);
    
    // 2. Render Row Bawah (1 Foto Landscape lebar)
    const caption3 = appState.photoCaptions[2] || defaultLabels[2];
    const box3 = createPDFPhotoBox(2, caption3, isPortraitList[2]);
    container.appendChild(box3);
  } else {
    // Rendering standard grid (2-landscape, 4-portrait)
    for (let i = 0; i < photoCount; i++) {
      const captionText = appState.photoCaptions[i] || defaultLabels[i];
      const box = createPDFPhotoBox(i, captionText, isPortraitList[i]);
      container.appendChild(box);
    }
  }
}

// Membuat Box Foto di halaman PDF
function createPDFPhotoBox(index, captionText, isPortrait) {
  const box = document.createElement('div');
  box.className = 'pdf-photo-box';
  
  const photoSrc = appState.photos[index];
  const transform = appState.photoTransforms[index] || { x: 0, y: 0, scale: 1.0 };
  const photoFit = appState.pdfPhotoFit || 'cover';
  
  if (photoSrc) {
    box.innerHTML = `
      <div class="pdf-photo-img-wrapper" style="overflow: hidden; position: relative; width: 100%; height: 100%; flex-grow: 1;">
        <img src="${photoSrc}" alt="Foto ${index + 1}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; transform: translate(${transform.x}px, ${transform.y}px) scale(${transform.scale}); transform-origin: center;">
      </div>
      <div class="pdf-photo-caption">${captionText}</div>
    `;
  } else {
    // Placeholder abu-abu jika foto belum diunggah
    box.innerHTML = `
      <div style="flex-grow: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; background-color: #f8fafc; color: #94a3b8; padding: 20px; text-align: center; border-bottom: 1px solid #e2e8f0; min-height: 120px;">
        <i class="fa-solid fa-image" style="font-size: 32px; margin-bottom: 8px; color: #cbd5e0;"></i>
        <span style="font-size: 11px; font-weight: bold;">[ FOTO BELUM DIUNGGAH ]</span>
      </div>
      <div class="pdf-photo-caption">${captionText}</div>
    `;
  }
  
  return box;
}

// 10. Generate PDF Report A4 & Simpan
function generatePDFReport() {
  const nama = elements.kegiatanNama.value.trim() || 'Laporan_Kegiatan';
  const cleanFileName = nama.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
  
  showLoading("Sedang menyusun halaman PDF A4...");
  
  // Element lembar pratinjau PDF A4 yang sesungguhnya di DOM
  const element = document.getElementById('pdf-content-to-render');
  
  // Simpan posisi scroll agar render bersih
  const originalScrollTop = window.scrollY;
  window.scrollTo(0, 0);
  
  // Konfigurasi html2canvas untuk menangkap elemen dengan resolusi tajam
  const options = {
    scale: 2.2, // Tingkatkan kualitas gambar agar hasil cetak PDF tajam
    useCORS: true, // Dukungan CORS untuk gambar eksternal jika ada
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false
  };
  
  setTimeout(() => {
    html2canvas(element, options).then(canvas => {
      // Kembalikan posisi scroll
      window.scrollTo(0, originalScrollTop);
      
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      
      // Ukuran halaman A4 dalam Point (72 DPI)
      // Lebar: 595.28 pt, Tinggi: 841.89 pt
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      
      // Unduh dokumen PDF
      pdf.save(`${cleanFileName}_${getFormattedDateShort()}.pdf`);
      
      hideLoading();
      
      // Alert sukses
      alert("Laporan PDF berhasil dibuat dan diunduh ke perangkat Anda!");
    }).catch(err => {
      console.error("Gagal membuat PDF:", err);
      window.scrollTo(0, originalScrollTop);
      hideLoading();
      alert("Gagal merender dokumen PDF. Silakan coba kembali.");
    });
  }, 300); // Berikan jeda sedikit agar rendering browser stabil
}

// 11. Bagikan ke WhatsApp
function shareToWhatsApp() {
  const nama = elements.kegiatanNama.value.trim();
  const tanggalInput = elements.kegiatanTanggal.value;
  const waktuInput = elements.kegiatanWaktu.value;
  const alamat = elements.kegiatanAlamat.value.trim();
  
  let tanggalFormatted = '-';
  if (tanggalInput) {
    const dateObj = new Date(tanggalInput);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    tanggalFormatted = dateObj.toLocaleDateString('id-ID', options);
    if (waktuInput) {
      tanggalFormatted += ` pukul ${waktuInput} WIB`;
    }
  }
  
  // 1. Ajakan Mengunduh PDF Terlebih Dahulu
  const confirmDownload = confirm(
    "Untuk membagikan laporan dengan berkas lengkap:\n" +
    "1. Kami akan mengunduh PDF laporan ke perangkat Anda terlebih dahulu.\n" +
    "2. Kemudian kami akan membuka WhatsApp.\n" +
    "3. Tempel draf pesan teks dan lampirkan berkas PDF yang barusan terunduh.\n\n" +
    "Lanjutkan?"
  );
  
  if (!confirmDownload) return;
  
  // Picu unduhan PDF secara otomatis
  generatePDFReport();
  
  // Susun teks draf untuk pesan WhatsApp
  let message = `*LAPORAN KEGIATAN LAPANGAN*\n\n`;
  message += `*Nama Kegiatan:* ${nama || '-'}\n`;
  message += `*Hari / Tanggal:* ${tanggalFormatted}\n`;
  message += `*Lokasi / Alamat:* ${alamat || '-'}\n`;
  
  if (appState.coordinates) {
    message += `*Koordinat GPS:* https://maps.google.com/?q=${appState.coordinates.lat},${appState.coordinates.lng} (${appState.coordinates.lat.toFixed(6)}, ${appState.coordinates.lng.toFixed(6)})\n`;
  }
  
  message += `\n_Catatan: Berkas detail PDF laporan A4 telah diunduh di perangkat. Silakan lampirkan berkas tersebut._`;
  
  const encodedText = encodeURIComponent(message);
  const waUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
  
  // Buka WhatsApp di tab/aplikasi baru setelah jeda agar proses unduh PDF dimulai
  setTimeout(() => {
    window.open(waUrl, '_blank');
  }, 1000);
}

// Helpers
function showLoading(text) {
  elements.loadingText.textContent = text;
  elements.loadingOverlay.classList.remove('hidden');
}

function hideLoading() {
  elements.loadingOverlay.classList.add('hidden');
}

function getFormattedDateShort() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}

// 12. Inisialisasi Voice Input (Speech-to-Text) untuk Catatan
function initVoiceInput() {
  const btnMic = document.getElementById('btn-mic-catatan');
  const catatanInput = document.getElementById('kegiatan-catatan');
  
  if (!btnMic || !catatanInput) return;
  
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    btnMic.style.display = 'none'; // Sembunyikan tombol jika browser tidak mendukung
    return;
  }
  
  const recognition = new SpeechRecognition();
  recognition.lang = 'id-ID';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  
  let isListening = false;
  
  btnMic.addEventListener('click', () => {
    if (isListening) {
      recognition.stop();
    } else {
      try {
        recognition.start();
      } catch (err) {
        console.error("Gagal memulai recognition:", err);
      }
    }
  });
  
  recognition.onstart = () => {
    isListening = true;
    btnMic.classList.add('recording');
    btnMic.innerHTML = '<i class="fa-solid fa-microphone-lines fa-beat"></i> Merekam...';
  };
  
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    const currentVal = catatanInput.value.trim();
    catatanInput.value = currentVal ? `${currentVal} ${transcript}` : transcript;
    
    // Picu event input untuk memperbarui pratinjau PDF secara otomatis
    catatanInput.dispatchEvent(new Event('input'));
  };
  
  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
    isListening = false;
    btnMic.classList.remove('recording');
    btnMic.innerHTML = '<i class="fa-solid fa-microphone"></i> Dikte';
    
    if (event.error === 'not-allowed') {
      alert("Izin mikrofon ditolak. Silakan izinkan akses mikrofon di pengaturan browser Anda.");
    }
  };
  
  recognition.onend = () => {
    isListening = false;
    btnMic.classList.remove('recording');
    btnMic.innerHTML = '<i class="fa-solid fa-microphone"></i> Dikte';
  };
}
