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

// 3. Membuat Element Box Foto untuk PDF dengan Watermark Logo & Timestamp
function createPDFPhotoBox(index, captionText, isPortrait) {
  const box = document.createElement('div');
  box.className = 'pdf-photo-box';
  
  const photoSrc = appState.photos[index];
  const transform = appState.photoTransforms[index] || { x: 0, y: 0, scale: 1.0 };
  
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
  
  let logoHtml = `<span class="w-logo"><i class="fa-solid fa-camera-retro"></i> LaporCAM</span>`;
  if (appState.logoDataURL) {
    logoHtml = `<span class="w-logo" style="display: flex; align-items: center; gap: 4px;"><img src="${appState.logoDataURL}" alt="Logo" style="height: 12px; max-width: 60px; object-fit: contain; vertical-align: middle;"></span>`;
  }
  
  if (photoSrc) {
    box.innerHTML = `
      <div class="pdf-photo-img-wrapper" style="overflow: hidden; position: relative; width: 100%; height: 100%; flex-grow: 1;">
        <img src="${photoSrc}" alt="Foto ${index + 1}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; transform: translate(${transform.x}px, ${transform.y}px) scale(${transform.scale}); transform-origin: center;">
        <div class="photo-watermark">
          <div class="watermark-row-main">
            ${logoHtml}
            ${tanggalFormatted ? `<span class="w-time"><i class="fa-solid fa-clock"></i> ${tanggalFormatted}</span>` : ''}
          </div>
          ${gpsText ? `<div class="watermark-row-gps"><i class="fa-solid fa-location-dot"></i> GPS: ${gpsText}</div>` : ''}
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
  const nama = elements.kegiatanNama.value.trim() || 'Dokumentasi_Kegiatan';
  const cleanFileName = nama.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
  
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
      pdf.save(`${cleanFileName}_${getFormattedDateShort()}.pdf`);
      
      hideLoading();
      showToast("Dokumentasi PDF berhasil dibuat dan diunduh ke perangkat Anda!", "success");
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
