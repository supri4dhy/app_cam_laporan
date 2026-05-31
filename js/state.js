// State Aplikasi Global
const appState = {
  currentStep: 1,
  selectedTemplate: '2-landscape', 
  photos: {}, // Menyimpan base64 dataURL untuk setiap slot foto
  photoCaptions: {}, // Menyimpan keterangan kustom untuk tiap slot foto
  photoTransforms: {}, // Menyimpan data geser dan perbesar { x: 0, y: 0, scale: 1.0 }
  pdfPhotoFit: 'cover',
  pdfPhotoSize: 'normal',
  coordinates: null,
  address: '',
  logoDataURL: null // Menyimpan base64 logo instansi kustom
};

// =========================================================
//  PERSISTENSI DATA: Simpan & Muat dari localStorage
//  Data yang disimpan permanen: Logo Instansi & Nama Pelapor
// =========================================================
const STORAGE_KEYS = {
  LOGO: 'laporcam_logo',
  PELAPOR: 'laporcam_pelapor'
};

window.simpanLogo = function(dataURL) {
  try {
    if (dataURL) {
      localStorage.setItem(STORAGE_KEYS.LOGO, dataURL);
    } else {
      localStorage.removeItem(STORAGE_KEYS.LOGO);
    }
  } catch (e) {
    // localStorage mungkin penuh (logo base64 besar), abaikan error
    console.warn('Gagal menyimpan logo ke localStorage:', e);
  }
};

window.muatLogoTersimpan = function() {
  return localStorage.getItem(STORAGE_KEYS.LOGO) || null;
};

window.simpanPelapor = function(nama) {
  if (nama && nama.trim()) {
    localStorage.setItem(STORAGE_KEYS.PELAPOR, nama.trim());
  }
};

window.muatPelaporTersimpan = function() {
  return localStorage.getItem(STORAGE_KEYS.PELAPOR) || '';
};

window.hapusLogoTersimpan = function() {
  localStorage.removeItem(STORAGE_KEYS.LOGO);
};

// DOM Elements Global Namespace
const elements = {
  kegiatanNama: document.getElementById('kegiatan-nama'),
  kegiatanTanggal: document.getElementById('kegiatan-tanggal'),
  kegiatanWaktu: document.getElementById('kegiatan-waktu'),
  kegiatanAlamat: document.getElementById('kegiatan-alamat'),
  kegiatanPelapor: document.getElementById('kegiatan-pelapor'),
  kegiatanLogo: document.getElementById('kegiatan-logo'),
  logoPreviewImg: document.getElementById('logo-preview-img'),
  btnUploadLogo: document.getElementById('btn-upload-logo'),
  btnRemoveLogo: document.getElementById('btn-remove-logo'),
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
  pdfValPelapor: document.getElementById('pdf-val-pelapor'),
  pdfValKoordinat: document.getElementById('pdf-val-koordinat'),
  pdfRowCoords: document.getElementById('pdf-row-coords'),
  pdfPhotosGridRender: document.getElementById('pdf-photos-grid-render'),
  pdfCurrentTimestamp: document.getElementById('pdf-current-timestamp'),
  pdfLogoImg: document.getElementById('pdf-logo-img'),
  pdfDefaultLogoIcon: document.getElementById('pdf-default-logo-icon'),
  
  // Action Buttons
  btnGeneratePdf: document.getElementById('btn-generate-pdf'),
  btnShareWa: document.getElementById('btn-share-wa'),
  
  // PWA Install Elements
  pwaInstallBanner: document.getElementById('btn-pwa-install'),
  btnPwaInstall: document.getElementById('btn-pwa-install'),
  btnPwaDismiss: null
};

// Sistem Notifikasi Toast Kustom Global
window.showToast = function(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  
  const toast = document.createElement('div');
  toast.className = `custom-toast toast-${type}`;
  
  let iconClass = 'fa-circle-info';
  if (type === 'success') iconClass = 'fa-circle-check';
  else if (type === 'error') iconClass = 'fa-circle-exclamation';
  else if (type === 'warning') iconClass = 'fa-triangle-exclamation';
  
  toast.innerHTML = `
    <div class="custom-toast-icon"><i class="fa-solid ${iconClass}"></i></div>
    <div class="custom-toast-message">${message}</div>
  `;
  
  container.appendChild(toast);
  
  // Memicu animasi masuk
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  // Hapus otomatis setelah 3.5 detik
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
      if (container.children.length === 0) {
        container.remove();
      }
    }, 300);
  }, 3500);
};
