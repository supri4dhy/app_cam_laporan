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

// 2. Memproses File Gambar & Kompresi ke base64
function processImageFile(file, slotId, slotEl) {
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
    
    transform.x = translateX;
    transform.y = translateY;
    appState.photoTransforms[slotId] = transform;
    
    preparePDFPreview();
  }
  
  img.addEventListener('mousedown', startDrag);
  img.addEventListener('touchstart', startDrag, { passive: false });
  
  img.addEventListener('mousemove', drag);
  img.addEventListener('touchmove', drag, { passive: false });
  
  img.addEventListener('mouseup', endDrag);
  img.addEventListener('mouseleave', endDrag);
  img.addEventListener('touchend', endDrag);
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
  
  const fileInput = slotEl.querySelector('.file-input');
  fileInput.value = '';
  
  preparePDFPreview();
}
