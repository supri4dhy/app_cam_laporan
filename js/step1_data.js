// Logika Step 1: Input Data Laporan & GPS

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

// 2. Deteksi GPS & Reverse Geocoding alamat jalan
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

// 3. Inisialisasi Penanganan Unggah Logo Instansi
function initLogoUpload() {
  const btnUpload = elements.btnUploadLogo;
  const btnRemove = elements.btnRemoveLogo;
  const fileInput = elements.kegiatanLogo;
  
  if (!btnUpload || !fileInput) return;
  
  btnUpload.addEventListener('click', () => {
    fileInput.click();
  });
  
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      processLogoFile(file);
    }
  });
  
  btnRemove.addEventListener('click', () => {
    removeLogo();
  });
}

function processLogoFile(file) {
  if (!file.type.startsWith('image/')) {
    alert("Berkas yang dipilih harus berupa gambar.");
    return;
  }
  
  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.src = event.target.result;
    
    img.onload = () => {
      // Kompresi logo ke resolusi wajar (max lebar/tinggi 200px) untuk watermark & kop
      const canvas = document.createElement('canvas');
      const maxDim = 200;
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
      
      // Simpan sebagai PNG transparan
      const compressedLogo = canvas.toDataURL('image/png');
      
      appState.logoDataURL = compressedLogo;
      
      // Update UI Form Preview
      if (elements.logoPreviewImg) {
        elements.logoPreviewImg.src = compressedLogo;
        elements.logoPreviewImg.classList.remove('hidden');
      }
      
      const placeholderIcon = document.getElementById('logo-placeholder-icon');
      if (placeholderIcon) {
        placeholderIcon.classList.add('hidden');
      }
      
      if (elements.btnRemoveLogo) {
        elements.btnRemoveLogo.classList.remove('hidden');
      }
      
      // Perbarui pratinjau PDF di Step 4
      preparePDFPreview();
    };
  };
  reader.readAsDataURL(file);
}

function removeLogo() {
  appState.logoDataURL = null;
  
  if (elements.logoPreviewImg) {
    elements.logoPreviewImg.src = '';
    elements.logoPreviewImg.classList.add('hidden');
  }
  
  const placeholderIcon = document.getElementById('logo-placeholder-icon');
  if (placeholderIcon) {
    placeholderIcon.classList.remove('hidden');
  }
  
  if (elements.btnRemoveLogo) {
    elements.btnRemoveLogo.classList.add('hidden');
  }
  if (elements.kegiatanLogo) {
    elements.kegiatanLogo.value = '';
  }
  
  // Perbarui pratinjau PDF di Step 4
  preparePDFPreview();
}
