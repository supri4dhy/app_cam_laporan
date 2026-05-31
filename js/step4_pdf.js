// Logika Step 4: Pratinjau PDF A4, Ekspor PDF, dan Share ke WhatsApp

// 1. Siapkan Pratinjau Lembar PDF A4 (Step 4)
function preparePDFPreview() {
  const nama = elements.kegiatanNama.value.trim() || 'Belum diisi';
  const tanggalInput = elements.kegiatanTanggal.value;
  const waktuInput = elements.kegiatanWaktu.value;
  const alamat = elements.kegiatanAlamat.value.trim() || 'Belum diisi';
  const pelapor = elements.kegiatanPelapor.value.trim() || 'Belum diisi';
  
  // Format Tanggal yang lebih bersahabat
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
  elements.pdfValPelapor.textContent = pelapor;
  
  // Update Logo Instansi di Header PDF
  if (appState.logoDataURL) {
    if (elements.pdfLogoImg) {
      elements.pdfLogoImg.src = appState.logoDataURL;
      elements.pdfLogoImg.classList.remove('hidden');
    }
    if (elements.pdfDefaultLogoIcon) {
      elements.pdfDefaultLogoIcon.classList.add('hidden');
    }
  } else {
    if (elements.pdfLogoImg) {
      elements.pdfLogoImg.src = '';
      elements.pdfLogoImg.classList.add('hidden');
    }
    if (elements.pdfDefaultLogoIcon) {
      elements.pdfDefaultLogoIcon.classList.remove('hidden');
    }
  }
  
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

  // Set link aplikasi dinamis sesuai domain server aktif
  const appLink = document.getElementById('pdf-app-link');
  if (appLink) {
    const cleanUrl = window.location.origin + window.location.pathname;
    appLink.href = cleanUrl;
    appLink.textContent = cleanUrl.replace(/\/$/, ''); // Hapus trailing slash agar rapi
  }
  
  // Render layout foto pada pratinjau PDF
  renderPDFPhotosLayout();
}

// 2. Render tata letak foto di PDF A4 sesuai template yang dipilih
function renderPDFPhotosLayout() {
  const container = elements.pdfPhotosGridRender;
  container.innerHTML = '';
  
  const t = appState.selectedTemplate;
  
  container.className = 'pdf-photos-grid';
  container.classList.add(`pdf-grid-${t}`);
  
  const sizeClass = appState.pdfPhotoSize || 'normal';
  container.classList.add(`size-${sizeClass}`);
  
  let photoCount = 2;
  let defaultLabels = [];
  let isPortraitList = [];
  
  if (t === '2-landscape') {
    photoCount = 2;
    defaultLabels = ['Foto Dokumentasi 1', 'Foto Dokumentasi 2'];
    isPortraitList = [false, false];
  } else if (t === '2-portrait') {
    photoCount = 2;
    defaultLabels = ['Foto Dokumentasi 1 (Portrait)', 'Foto Dokumentasi 2 (Portrait)'];
    isPortraitList = [true, true];
  } else if (t === '3-landscape') {
    photoCount = 3;
    defaultLabels = ['Foto Dokumentasi 1', 'Foto Dokumentasi 2', 'Foto Dokumentasi 3'];
    isPortraitList = [false, false, false];
  } else if (t === '3-mix') {
    photoCount = 3;
    defaultLabels = ['Foto Dokumentasi 1', 'Foto Dokumentasi 2', 'Foto Dokumentasi 3'];
    isPortraitList = [true, true, false];
  } else if (t === '4-portrait') {
    photoCount = 4;
    defaultLabels = ['Foto Dokumentasi 1', 'Foto Dokumentasi 2', 'Foto Dokumentasi 3', 'Foto Dokumentasi 4'];
    isPortraitList = [true, true, true, true];
  } else if (t === '4-landscape') {
    photoCount = 4;
    defaultLabels = ['Foto Dokumentasi 1', 'Foto Dokumentasi 2', 'Foto Dokumentasi 3', 'Foto Dokumentasi 4'];
    isPortraitList = [false, false, false, false];
  }
  
  if (t === '3-mix') {
    const topRow = document.createElement('div');
    topRow.className = 'pdf-grid-3-toprow';
    
    const caption1 = appState.photoCaptions[0] || defaultLabels[0];
    const caption2 = appState.photoCaptions[1] || defaultLabels[1];
    
    const box1 = createPDFPhotoBox(0, caption1, isPortraitList[0]);
    const box2 = createPDFPhotoBox(1, caption2, isPortraitList[1]);
    
    topRow.appendChild(box1);
    topRow.appendChild(box2);
    container.appendChild(topRow);
    
    const caption3 = appState.photoCaptions[2] || defaultLabels[2];
    const box3 = createPDFPhotoBox(2, caption3, isPortraitList[2]);
    container.appendChild(box3);
  } else {
    for (let i = 0; i < photoCount; i++) {
      const captionText = appState.photoCaptions[i] || defaultLabels[i];
      const box = createPDFPhotoBox(i, captionText, isPortraitList[i]);
      container.appendChild(box);
    }
  }
}

// Helper: Dapatkan dimensi piksel boks foto PDF berdasarkan template dan indeks slot (Rasio 4:3 / 3:4)
function getPDFBoxDimensions(t, index) {
  let w = 300;
  let h = 225;
  
  if (t === '2-landscape') {
    w = 520;
    h = 390;
  } else if (t === '3-landscape') {
    w = 340;
    h = 255;
  } else if (t === '3-mix') {
    if (index === 0 || index === 1) {
      w = 215;
      h = 287;
    } else {
      w = 340;
      h = 255;
    }
  } else if (t === '4-portrait') {
    w = 220;
    h = 293;
  } else if (t === '2-portrait') {
    w = 280;
    h = 373;
  } else if (t === '4-landscape') {
    w = 300;
    h = 225;
  }
  
  return { w, h };
}

// 3. Membuat Element Box Foto untuk PDF dengan Watermark Logo & Timestamp
function createPDFPhotoBox(index, captionText, isPortrait) {
  const box = document.createElement('div');
  box.className = 'pdf-photo-box';
  
  const photoSrc = appState.photos[index];
  const transform = appState.photoTransforms[index] || { x: 0, y: 0, scale: 1.0, pctX: 0, pctY: 0 };
  
  // Siapkan data untuk watermark
  const tanggalInput = elements.kegiatanTanggal.value;
  const waktuInput = elements.kegiatanWaktu.value;
  let tanggalFormatted = '';
  if (tanggalInput) {
    const dateObj = new Date(tanggalInput);
    const d = String(dateObj.getDate()).padStart(2, '0');
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const y = dateObj.getFullYear();
    tanggalFormatted = `${d}/${m}/${y}`;
    if (waktuInput) {
      tanggalFormatted += ` ${waktuInput} WIB`;
    }
  }

  let gpsText = '';
  if (appState.coordinates) {
    gpsText = `${appState.coordinates.lat.toFixed(5)}, ${appState.coordinates.lng.toFixed(5)}`;
  }
  
  let logoHtml = `<span class="w-logo" style="color: #2dd4bf;"><i class="fa-solid fa-camera-retro"></i> LaporCAM</span>`;
  
  if (photoSrc) {
    const r_img = appState.photoAspectRatios[index] || 1.0;
    const dims = getPDFBoxDimensions(appState.selectedTemplate, index);
    const W_box_pdf = dims.w;
    const H_box_pdf = dims.h;
    const r_box_pdf = W_box_pdf / H_box_pdf;
    
    let W_render_pdf, H_render_pdf, top_render_pdf, left_render_pdf;
    
    if (r_img >= r_box_pdf) { // Gambar lebih landscape dari boks (Cover)
      H_render_pdf = H_box_pdf;
      W_render_pdf = H_box_pdf * r_img;
      left_render_pdf = (W_box_pdf - W_render_pdf) / 2;
      top_render_pdf = 0;
    } else { // Gambar lebih portrait dari boks (Cover)
      W_render_pdf = W_box_pdf;
      H_render_pdf = W_box_pdf / r_img;
      top_render_pdf = (H_box_pdf - H_render_pdf) / 2;
      left_render_pdf = 0;
    }
    
    // Hitung batas geser PDF
    const scale = transform.scale || 1.0;
    const W_zoom_pdf = W_render_pdf * scale;
    const H_zoom_pdf = H_render_pdf * scale;
    
    const maxX_pdf = Math.max(0, (W_zoom_pdf - W_box_pdf) / 2);
    const maxY_pdf = Math.max(0, (H_zoom_pdf - H_box_pdf) / 2);
    
    // Hitung pergeseran PDF berdasarkan persentase pergeseran di Step 3
    const pctX = transform.pctX || 0;
    const pctY = transform.pctY || 0;
    const x_pdf = pctX * maxX_pdf;
    const y_pdf = pctY * maxY_pdf;

    // Siapkan logo kustom melayang di pojok kanan atas jika diunggah pengguna (menggunakan ukuran persentase terhadap boks foto)
    let customLogoHtml = '';
    if (appState.logoDataURL) {
      customLogoHtml = `
        <div class="photo-logo-watermark" style="position: absolute; top: 2.5%; right: 2.5%; z-index: 60; opacity: 0.8; width: 10%; display: flex; justify-content: center; align-items: center; pointer-events: none;">
          <img src="${appState.logoDataURL}" style="width: 100%; height: auto; object-fit: contain; background: transparent; filter: none;">
        </div>
      `;
    }

    box.innerHTML = `
      <div class="pdf-photo-img-wrapper" style="overflow: hidden; position: relative; width: ${W_box_pdf}px; height: ${H_box_pdf}px; flex-shrink: 0;">
        <img src="${photoSrc}" alt="Foto ${index + 1}" style="position: absolute; top: ${top_render_pdf}px; left: ${left_render_pdf}px; width: ${W_render_pdf}px; height: ${H_render_pdf}px; object-fit: fill; transform: translate(${x_pdf}px, ${y_pdf}px) scale(${scale}); transform-origin: center;">
        ${customLogoHtml}
        <div class="photo-watermark" style="position: absolute; bottom: 0; left: 0; right: 0; z-index: 50;">
          <div class="watermark-row-main">
            ${tanggalFormatted ? `<span class="w-time"><i class="fa-solid fa-clock"></i> ${tanggalFormatted}</span>` : ''}
            ${gpsText ? `<span class="w-time" style="margin-left: auto;"><i class="fa-solid fa-location-dot"></i> GPS: ${gpsText}</span>` : ''}
          </div>
        </div>
      </div>
      <div class="pdf-photo-caption">${captionText}</div>
    `;
  } else {
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

// 4. Membuat PDF Laporan A4
function generatePDFReport() {
  const namaInput = elements.kegiatanNama.value.trim() || 'Dokumentasi_Kegiatan';
  const kataArray = namaInput.split(/\s+/).slice(0, 5);
  const cleanWords = kataArray.map(w => w.replace(/[^a-zA-Z0-9]/g, ''));
  const cleanFileName = cleanWords.filter(w => w.length > 0).join('_') || 'Dokumentasi_Kegiatan';
  
  const d = new Date();
  const formatTgl = `${String(d.getDate()).padStart(2,'0')}_${String(d.getMonth()+1).padStart(2,'0')}_${d.getFullYear()}`;
  const finalFileName = `${cleanFileName}_${formatTgl}.pdf`;
  
  showLoading("Sedang menyusun halaman PDF A4...");
  
  const element = document.getElementById('pdf-content-to-render');
  const originalScrollTop = window.scrollY;
  window.scrollTo(0, 0);
  
  const options = {
    scale: 2.2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false
  };
  
  setTimeout(() => {
    html2canvas(element, options).then(canvas => {
      window.scrollTo(0, originalScrollTop);
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(finalFileName);
      
      hideLoading();
      showToast("Dokumentasi PDF berhasil dibuat dan diunduh ke perangkat Anda!", "success");
      
      if (typeof window.bersihkanDraftStorageOnly === 'function') {
        window.bersihkanDraftStorageOnly();
      }
    }).catch(err => {
      console.error("Gagal membuat PDF:", err);
      window.scrollTo(0, originalScrollTop);
      hideLoading();
      showToast("Gagal merender dokumen PDF. Silakan coba kembali.", "error");
    });
  }, 300);
}

// 5. Kirim pesan ke WhatsApp
function shareToWhatsApp() {
  const nama = elements.kegiatanNama.value.trim();
  const tanggalInput = elements.kegiatanTanggal.value;
  const waktuInput = elements.kegiatanWaktu.value;
  const alamat = elements.kegiatanAlamat.value.trim();
  const pelapor = elements.kegiatanPelapor.value.trim();
  
  let tanggalFormatted = '-';
  if (tanggalInput) {
    const dateObj = new Date(tanggalInput);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    tanggalFormatted = dateObj.toLocaleDateString('id-ID', options);
    if (waktuInput) {
      tanggalFormatted += ` pukul ${waktuInput} WIB`;
    }
  }
  
  const confirmDownload = confirm(
    "Untuk membagikan laporan dengan berkas lengkap:\n" +
    "1. Kami akan mengunduh PDF laporan ke perangkat Anda terlebih dahulu.\n" +
    "2. Kemudian kami akan membuka WhatsApp.\n" +
    "3. Tempel draf pesan teks dan lampirkan berkas PDF yang barusan terunduh.\n\n" +
    "Lanjutkan?"
  );
  
  if (!confirmDownload) return;
  
  generatePDFReport();
  
  let message = `*DOKUMENTASI KEGIATAN*\n\n`;
  message += `*Pelapor / Petugas:* ${pelapor || '-'}\n`;
  message += `*Nama Kegiatan:* ${nama || '-'}\n`;
  message += `*Hari / Tanggal:* ${tanggalFormatted}\n`;
  message += `*Lokasi / Alamat:* ${alamat || '-'}\n`;
  
  if (appState.coordinates) {
    message += `*Koordinat GPS:* https://maps.google.com/?q=${appState.coordinates.lat},${appState.coordinates.lng} (${appState.coordinates.lat.toFixed(6)}, ${appState.coordinates.lng.toFixed(6)})\n`;
  }
  
  message += `\n_Catatan: Berkas detail PDF laporan A4 telah diunduh di perangkat. Silakan lampirkan berkas tersebut._`;
  
  const encodedText = encodeURIComponent(message);
  const waUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
  
  setTimeout(() => {
    window.open(waUrl, '_blank');
  }, 1000);
}
