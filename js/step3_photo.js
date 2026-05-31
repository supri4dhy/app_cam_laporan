// Logika Step 3: Unggah Foto, Kompresi, Zoom & Pan (Drag), serta Keterangan Foto

// 1. Render Slot Foto Sesuai Template
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
    case '2-portrait':
      slots = [
        { id: 0, label: 'Foto 1 (Portrait)', isPortrait: true, defaultCaption: 'Foto Dokumentasi 1 (Portrait)' },
        { id: 1, label: 'Foto 2 (Portrait)', isPortrait: true, defaultCaption: 'Foto Dokumentasi 2 (Portrait)' }
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
    case '4-landscape':
      slots = [
        { id: 0, label: 'Foto 1 (Landscape)', isPortrait: false, defaultCaption: 'Foto Dokumentasi 1' },
        { id: 1, label: 'Foto 2 (Landscape)', isPortrait: false, defaultCaption: 'Foto Dokumentasi 2' },
        { id: 2, label: 'Foto 3 (Landscape)', isPortrait: false, defaultCaption: 'Foto Dokumentasi 3' },
        { id: 3, label: 'Foto 4 (Landscape)', isPortrait: false, defaultCaption: 'Foto Dokumentasi 4' }
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
      <!-- Input untuk Galeri / Desktop -->
      <input type="file" accept="image/*" class="hidden file-input-gallery">
      <!-- Input untuk Kamera Langsung (Mobile capture) -->
      <input type="file" accept="image/*" capture="environment" class="hidden file-input-camera">
    `;
    
    // Event listener untuk memicu input file saat slot diklik
    slotEl.addEventListener('click', (e) => {
      if (appState.photos[slot.id]) return;
      if (e.target.closest('.photo-overlay-btn')) return;
      
      const fileInputGallery = slotEl.querySelector('.file-input-gallery');
      const fileInputCamera = slotEl.querySelector('.file-input-camera');
      
      // Deteksi perangkat seluler (mobile)
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isMobileDevice) {
        // Panggil Bottom Sheet media picker kustom
        showMediaPicker((source) => {
          if (source === 'camera') {
            if (typeof window.bukaKameraInline === 'function') {
              window.bukaKameraInline(slot.id, slotEl);
            } else {
              fileInputCamera.click();
            }
          } else {
            fileInputGallery.click();
          }
        });
      } else {
        // Desktop langsung panggil galeri file chooser
        fileInputGallery.click();
      }
    });
    
    // Event listener untuk menangani file gambar yang masuk
    const handleFileChange = (e) => {
      const file = e.target.files[0];
      if (file) {
        processImageFile(file, slot.id, slotEl);
      }
    };
    
    slotEl.querySelector('.file-input-gallery').addEventListener('change', handleFileChange);
    slotEl.querySelector('.file-input-camera').addEventListener('change', handleFileChange);
    
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
      
      const img = slotEl.querySelector('.photo-preview-img');
      if (img) {
        // Terapkan pembatasan batas geser aman
        const bounds = calculateBounds(img, slotEl, val);
        transform.x = Math.max(-bounds.maxX, Math.min(bounds.maxX, transform.x));
        transform.y = Math.max(-bounds.maxY, Math.min(bounds.maxY, transform.y));
        
        img.style.transform = `translate(${transform.x}px, ${transform.y}px) scale(${val})`;
      }
      
      appState.photoTransforms[slot.id] = transform;
      preparePDFPreview();
    });

    zoomRangeInput.addEventListener('change', () => {
      if (typeof window.simpanDraftLaporan === 'function') {
        window.simpanDraftLaporan();
      }
    });
    
    // Simpan keterangan ke state saat diketik
    const captionInput = controlsGroup.querySelector('.photo-caption-input');
    captionInput.addEventListener('input', (e) => {
      appState.photoCaptions[slot.id] = e.target.value.trim();
      preparePDFPreview();
      if (typeof window.simpanDraftLaporan === 'function') {
        window.simpanDraftLaporan();
      }
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

// 2. Memproses File Gambar & Kompresi ke base64
function processImageFile(file, slotId, slotEl) {
  if (!file.type.startsWith('image/')) {
    showToast("Berkas yang dipilih harus berupa gambar.", "warning");
    return;
  }
  
  showLoading("Mengompres & memuat gambar...");
  
  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.src = event.target.result;
    
    img.onload = () => {
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
      
      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      
      appState.photos[slotId] = compressedDataUrl;
      appState.photoTransforms[slotId] = { x: 0, y: 0, scale: 1.0 };
      
      updateSlotPreviewUI(slotEl, slotId, compressedDataUrl);
      attachDragHandlers(slotEl, slotId);
      
      hideLoading();
      if (typeof window.simpanDraftLaporan === 'function') {
        window.simpanDraftLaporan();
      }
    };
  };
  
  reader.readAsDataURL(file);
}

// 3. Update UI Slot Foto dengan Preview Gambar & Overlay
function updateSlotPreviewUI(slotEl, slotId, dataUrl) {
  const placeholder = slotEl.querySelector('.photo-slot-placeholder');
  if (placeholder) placeholder.classList.add('hidden');
  
  const oldImg = slotEl.querySelector('.photo-preview-img');
  if (oldImg) oldImg.remove();
  const oldOverlay = slotEl.querySelector('.photo-overlay');
  if (oldOverlay) oldOverlay.remove();
  
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
  
  overlayEl.querySelector('.btn-change').addEventListener('click', (e) => {
    e.stopPropagation();
    slotEl.querySelector('.file-input').click();
  });
  
  overlayEl.querySelector('.btn-delete').addEventListener('click', (e) => {
    e.stopPropagation();
    deletePhoto(slotId, slotEl);
  });
  
  slotEl.appendChild(overlayEl);
}

// 4. Pasang Handlers untuk Geser (Drag & Pan) Gambar
function attachDragHandlers(slotEl, slotId) {
  const img = slotEl.querySelector('.photo-preview-img');
  if (!img) return;
  
  const transform = appState.photoTransforms[slotId] || { x: 0, y: 0, scale: 1.0 };
  
  // Terapkan batas geser awal saat render
  const bounds = calculateBounds(img, slotEl, transform.scale);
  transform.x = Math.max(-bounds.maxX, Math.min(bounds.maxX, transform.x));
  transform.y = Math.max(-bounds.maxY, Math.min(bounds.maxY, transform.y));
  appState.photoTransforms[slotId] = transform;
  
  img.style.transform = `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`;
  img.style.transformOrigin = 'center';
  img.style.cursor = 'grab';
  
  let isDragging = false;
  let isPinching = false;
  
  let startX = 0;
  let startY = 0;
  let translateX = transform.x;
  let translateY = transform.y;
  
  let startDistance = 0;
  let startScale = transform.scale;
  
  function startDrag(e) {
    if (e.target.closest('.photo-overlay-btn')) return;
    
    if (e.touches && e.touches.length === 2) {
      // Aktifkan mode pinch-to-zoom dengan 2 jari
      isDragging = false;
      isPinching = true;
      startDistance = getDistance(e.touches[0], e.touches[1]);
      startScale = transform.scale;
    } else if (!e.touches || e.touches.length === 1) {
      // Aktifkan mode geser gambar biasa
      isDragging = true;
      isPinching = false;
      
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      
      startX = clientX - translateX;
      startY = clientY - translateY;
      
      img.style.cursor = 'grabbing';
    }
  }
  
  function drag(e) {
    if (isPinching && e.touches && e.touches.length === 2) {
      e.preventDefault();
      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      if (startDistance === 0) return;
      
      // Kalkulasi skala zoom baru
      let newScale = startScale * (currentDistance / startDistance);
      newScale = Math.max(1.0, Math.min(3.0, newScale)); // Batas zoom 1.0x sampai 3.0x
      
      transform.scale = newScale;
      
      // Amankan pergeseran agar tidak bocor dari batas slot foto
      const bounds = calculateBounds(img, slotEl, newScale);
      translateX = Math.max(-bounds.maxX, Math.min(bounds.maxX, translateX));
      translateY = Math.max(-bounds.maxY, Math.min(bounds.maxY, translateY));
      
      transform.x = translateX;
      transform.y = translateY;
      appState.photoTransforms[slotId] = transform;
      
      img.style.transform = `translate(${translateX}px, ${translateY}px) scale(${newScale})`;
      
      // Sinkronkan ke slider input zoom jika terlihat (di desktop)
      const slider = slotEl.parentElement.querySelector('.zoom-range-input');
      if (slider) slider.value = newScale;
      
    } else if (isDragging) {
      e.preventDefault();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      
      let rawX = clientX - startX;
      let rawY = clientY - startY;
      
      // Amankan pergeseran gambar dari batas tepi slot foto
      const bounds = calculateBounds(img, slotEl, transform.scale);
      translateX = Math.max(-bounds.maxX, Math.min(bounds.maxX, rawX));
      translateY = Math.max(-bounds.maxY, Math.min(bounds.maxY, rawY));
      
      img.style.transform = `translate(${translateX}px, ${translateY}px) scale(${transform.scale})`;
    }
  }
  
  function endDrag() {
    if (isDragging || isPinching) {
      isDragging = false;
      isPinching = false;
      img.style.cursor = 'grab';
      
      transform.x = translateX;
      transform.y = translateY;
      appState.photoTransforms[slotId] = transform;
      
      preparePDFPreview();
      if (typeof window.simpanDraftLaporan === 'function') {
        window.simpanDraftLaporan();
      }
    }
  }
  
  img.addEventListener('mousedown', startDrag);
  img.addEventListener('touchstart', startDrag, { passive: false });
  
  img.addEventListener('mousemove', drag);
  img.addEventListener('touchmove', drag, { passive: false });
  
  img.addEventListener('mouseup', endDrag);
  img.addEventListener('mouseleave', endDrag);
  img.addEventListener('touchend', endDrag);
  
  // Zooming dengan Mouse Wheel (Desktop bonus)
  img.addEventListener('wheel', (e) => {
    e.preventDefault();
    let delta = -e.deltaY * 0.001;
    let newScale = transform.scale + delta;
    newScale = Math.max(1.0, Math.min(3.0, newScale));
    
    transform.scale = newScale;
    
    const bounds = calculateBounds(img, slotEl, newScale);
    translateX = Math.max(-bounds.maxX, Math.min(bounds.maxX, translateX));
    translateY = Math.max(-bounds.maxY, Math.min(bounds.maxY, translateY));
    
    transform.x = translateX;
    transform.y = translateY;
    appState.photoTransforms[slotId] = transform;
    
    img.style.transform = `translate(${translateX}px, ${translateY}px) scale(${newScale})`;
    
    const slider = slotEl.parentElement.querySelector('.zoom-range-input');
    if (slider) slider.value = newScale;
    
    preparePDFPreview();
    if (typeof window.simpanDraftLaporan === 'function') {
      window.simpanDraftLaporan();
    }
  }, { passive: false });
}

// Helper: Hitung jarak antar 2 jari sentuh (Pinch)
function getDistance(touch1, touch2) {
  const dx = touch1.clientX - touch2.clientX;
  const dy = touch1.clientY - touch2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

// Helper: Hitung batas geser maksimum (maxX, maxY) agar gambar tidak meninggalkan celah di boks
function calculateBounds(imgEl, slotEl, scale) {
  const W_box = slotEl.clientWidth;
  const H_box = slotEl.clientHeight;
  
  // Ambil resolusi asli gambar
  const W_img = imgEl.naturalWidth || W_box;
  const H_img = imgEl.naturalHeight || H_box;
  
  const r_box = W_box / H_box;
  const r_img = W_img / H_img;
  
  let W_render = W_box;
  let H_render = H_box;
  
  // Hitung dimensi render aktual karena menggunakan object-fit: cover
  if (r_img > r_box) {
    H_render = H_box;
    W_render = H_box * r_img;
  } else {
    W_render = W_box;
    H_render = W_box / r_img;
  }
  
  // Hitung batas geser X & Y maksimal dari titik tengah
  const maxX = Math.max(0, ((W_render * scale) - W_box) / 2);
  const maxY = Math.max(0, ((H_render * scale) - H_box) / 2);
  
  return { maxX, maxY };
}

// 5. Hapus Foto dari Slot
function deletePhoto(slotId, slotEl) {
  delete appState.photos[slotId];
  delete appState.photoTransforms[slotId];
  
  const placeholder = slotEl.querySelector('.photo-slot-placeholder');
  if (placeholder) placeholder.classList.remove('hidden');
  
  const img = slotEl.querySelector('.photo-preview-img');
  if (img) img.remove();
  
  const overlay = slotEl.querySelector('.photo-overlay');
  if (overlay) overlay.remove();
  
  const fileInputGallery = slotEl.querySelector('.file-input-gallery');
  if (fileInputGallery) fileInputGallery.value = '';
  const fileInputCamera = slotEl.querySelector('.file-input-camera');
  if (fileInputCamera) fileInputCamera.value = '';
  
  preparePDFPreview();
  if (typeof window.simpanDraftLaporan === 'function') {
    window.simpanDraftLaporan();
  }
}

// 6. Implementasi Bottom Sheet Picker untuk HP (Camera vs Gallery)
function showMediaPicker(onSourceSelected) {
  // Hapus Picker lama jika tersisa
  const oldBackdrop = document.querySelector('.media-picker-backdrop');
  if (oldBackdrop) oldBackdrop.remove();
  const oldSheet = document.querySelector('.media-picker-sheet');
  if (oldSheet) oldSheet.remove();

  // Buat backdrop
  const backdrop = document.createElement('div');
  backdrop.className = 'media-picker-backdrop';
  
  // Buat sheet menu
  const sheet = document.createElement('div');
  sheet.className = 'media-picker-sheet';
  sheet.innerHTML = `
    <div class="media-picker-header">
      <div class="media-picker-indicator"></div>
      <h4>Pilih Sumber Foto</h4>
    </div>
    <div class="media-picker-options">
      <button type="button" class="picker-opt btn-camera">
        <div class="opt-icon"><i class="fa-solid fa-camera"></i></div>
        <span>Ambil Foto (Kamera)</span>
      </button>
      <button type="button" class="picker-opt btn-gallery">
        <div class="opt-icon"><i class="fa-solid fa-images"></i></div>
        <span>Pilih dari Galeri</span>
      </button>
    </div>
    <button type="button" class="media-picker-cancel">Batal</button>
  `;
  
  document.body.appendChild(backdrop);
  document.body.appendChild(sheet);
  
  // Trigger animasi masuk
  setTimeout(() => {
    backdrop.classList.add('show');
    sheet.classList.add('show');
  }, 10);
  
  const close = () => {
    backdrop.classList.remove('show');
    sheet.classList.remove('show');
    setTimeout(() => {
      backdrop.remove();
      sheet.remove();
    }, 300);
  };
  
  backdrop.addEventListener('click', close);
  sheet.querySelector('.media-picker-cancel').addEventListener('click', close);
  
  sheet.querySelector('.btn-camera').addEventListener('click', () => {
    close();
    onSourceSelected('camera');
  });
  
  sheet.querySelector('.btn-gallery').addEventListener('click', () => {
    close();
    onSourceSelected('gallery');
  });
}

// =========================================================
//  KAMERA INLINE HTML5 WEBRTC (ANTI-CRASH MEMORI)
// =========================================================
let activeCameraStream = null;
let currentFacingMode = 'environment';
let currentActiveSlotId = null;
let currentActiveSlotEl = null;

window.bukaKameraInline = function(slotId, slotEl) {
  currentActiveSlotId = slotId;
  currentActiveSlotEl = slotEl;
  
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showToast("Kamera inline tidak didukung di browser Anda. Membuka kamera bawaan HP...", "warning");
    const fileInputCamera = slotEl.querySelector('.file-input-camera');
    if (fileInputCamera) fileInputCamera.click();
    return;
  }
  
  const modal = document.getElementById('camera-modal');
  if (modal) {
    modal.classList.remove('hidden');
    setTimeout(() => {
      modal.classList.add('show');
    }, 10);
  }
  
  currentFacingMode = 'environment'; // Default mulai dengan kamera belakang
  startCameraStream(currentFacingMode);
};

function startCameraStream(facingMode) {
  stopCameraStream();
  
  const video = document.getElementById('camera-stream');
  if (!video) return;
  
  showToast("Mengaktifkan kamera...", "info");
  
  // Pilihan resolusi yang wajar (1280x720) demi hemat RAM dan kualitas tajam
  const constraints = {
    video: {
      facingMode: facingMode,
      width: { ideal: 1280 },
      height: { ideal: 720 }
    },
    audio: false
  };
  
  navigator.mediaDevices.getUserMedia(constraints)
    .then(stream => {
      video.srcObject = stream;
      activeCameraStream = stream;
      
      // Jika kamera depan aktif, cerminkan videonya secara visual (efek cermin)
      if (facingMode === 'user') {
        video.classList.add('user-facing');
      } else {
        video.classList.remove('user-facing');
      }
    })
    .catch(err => {
      console.warn("Gagal mengaktifkan kamera dengan facingMode:", facingMode, err);
      
      // Fallback 1: Coba tanpa constraint resolusi ideal jika gagal
      navigator.mediaDevices.getUserMedia({ video: { facingMode: facingMode }, audio: false })
        .then(stream => {
          video.srcObject = stream;
          activeCameraStream = stream;
          if (facingMode === 'user') {
            video.classList.add('user-facing');
          } else {
            video.classList.remove('user-facing');
          }
        })
        .catch(err2 => {
          console.error("Gagal total mengaktifkan kamera kustom:", err2);
          showToast("Gagal mengakses kamera kustom. Membuka kamera bawaan HP...", "warning");
          tutupKameraInline();
          
          // Fallback 2: Buka input kamera bawaan HP
          if (currentActiveSlotEl) {
            const fileInputCamera = currentActiveSlotEl.querySelector('.file-input-camera');
            if (fileInputCamera) fileInputCamera.click();
          }
        });
    });
}

function stopCameraStream() {
  const video = document.getElementById('camera-stream');
  if (video) {
    video.srcObject = null;
  }
  if (activeCameraStream) {
    activeCameraStream.getTracks().forEach(track => track.stop());
    activeCameraStream = null;
  }
}

function tutupKameraInline() {
  stopCameraStream();
  const modal = document.getElementById('camera-modal');
  if (modal) {
    modal.classList.remove('show');
    setTimeout(() => {
      modal.classList.add('hidden');
    }, 300);
  }
}

// Inisialisasi event listener tombol modal kamera inline kustom
document.addEventListener('DOMContentLoaded', () => {
  const btnClose = document.getElementById('btn-camera-close');
  const btnSwitch = document.getElementById('btn-camera-switch');
  const btnShutter = document.getElementById('btn-camera-shutter');
  
  if (btnClose) {
    btnClose.addEventListener('click', tutupKameraInline);
  }
  
  if (btnSwitch) {
    btnSwitch.addEventListener('click', () => {
      currentFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
      startCameraStream(currentFacingMode);
    });
  }
  
  if (btnShutter) {
    btnShutter.addEventListener('click', ambilFotoKameraInline);
  }
});

function ambilFotoKameraInline() {
  const video = document.getElementById('camera-stream');
  const canvas = document.getElementById('camera-capture-canvas');
  if (!video || !canvas || !activeCameraStream) return;
  
  // Ambil resolusi video stream yang sebenarnya
  const width = video.videoWidth || video.clientWidth || 1280;
  const height = video.videoHeight || video.clientHeight || 720;
  
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  
  // Jika kamera depan, cerminkan gambarnya secara horisontal agar WYSIWYG
  if (currentFacingMode === 'user') {
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
  }
  
  ctx.drawImage(video, 0, 0, width, height);
  
  // Reset transform canvas kembali ke normal
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  
  // Kompresi hasil tangkapan foto ke format jpeg
  const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
  
  // Simpan foto ke state
  if (currentActiveSlotId !== null && currentActiveSlotEl !== null) {
    processCapturedPhotoData(dataUrl, currentActiveSlotId, currentActiveSlotEl);
  }
  
  tutupKameraInline();
}

function processCapturedPhotoData(dataUrl, slotId, slotEl) {
  showLoading("Memproses & memuat foto...");
  
  const img = new Image();
  img.src = dataUrl;
  img.onload = () => {
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
    
    const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    
    appState.photos[slotId] = compressedDataUrl;
    appState.photoTransforms[slotId] = { x: 0, y: 0, scale: 1.0 };
    
    updateSlotPreviewUI(slotEl, slotId, compressedDataUrl);
    attachDragHandlers(slotEl, slotId);
    
    hideLoading();
    
    if (typeof window.simpanDraftLaporan === 'function') {
      window.simpanDraftLaporan();
    }
    
    // Perbarui PDF Preview di Step 4
    if (typeof preparePDFPreview === 'function') {
      preparePDFPreview();
    }
  };
}
