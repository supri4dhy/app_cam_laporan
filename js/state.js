// State Aplikasi Global
const appState = {
  currentStep: 1,
  selectedTemplate: '2-landscape', 
  photos: {}, // Menyimpan base64 dataURL untuk setiap slot foto
  photoCaptions: {}, // Menyimpan keterangan kustom untuk tiap slot foto
  photoTransforms: {}, // Menyimpan data geser dan perbesar { x: 0, y: 0, scale: 1.0 }
  photoAspectRatios: {}, // Menyimpan aspek rasio asli gambar {[slotId]: ratio}
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
  btnResetDraft: document.getElementById('btn-reset-draft'),
  
  // PWA Install Elements
  pwaInstallBanner: document.getElementById('btn-pwa-install'),
  btnPwaInstall: document.getElementById('btn-pwa-install'),
  btnPwaDismiss: null
};

// =========================================================
//  DRAFT LAPORAN REALTIME (LocalStorage)
// =========================================================
const DRAFT_KEY = 'laporcam_draft';

window.simpanDraftLaporan = function() {
  try {
    const draftData = {
      nama: elements.kegiatanNama ? elements.kegiatanNama.value : '',
      tanggal: elements.kegiatanTanggal ? elements.kegiatanTanggal.value : '',
      waktu: elements.kegiatanWaktu ? elements.kegiatanWaktu.value : '',
      alamat: elements.kegiatanAlamat ? elements.kegiatanAlamat.value : '',
      pelapor: elements.kegiatanPelapor ? elements.kegiatanPelapor.value : '',
      currentStep: appState.currentStep,
      selectedTemplate: appState.selectedTemplate,
      photos: appState.photos,
      photoCaptions: appState.photoCaptions,
      photoTransforms: appState.photoTransforms,
      photoAspectRatios: appState.photoAspectRatios,
      pdfPhotoFit: appState.pdfPhotoFit,
      pdfPhotoSize: appState.pdfPhotoSize,
      coordinates: appState.coordinates,
      address: appState.address
    };
    
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
    
    // Tampilkan tombol "Mulai Baru" jika ada isi draf yang signifikan
    if (elements.btnResetDraft) {
      elements.btnResetDraft.classList.remove('hidden');
    }
  } catch (e) {
    console.warn('Gagal menyimpan draf laporan ke localStorage:', e);
  }
};

window.muatDraftLaporan = function() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return false;
    
    const draft = JSON.parse(raw);
    if (!draft) return false;
    
    // Isi nilai input form
    if (elements.kegiatanNama) elements.kegiatanNama.value = draft.nama || '';
    if (elements.kegiatanTanggal) elements.kegiatanTanggal.value = draft.tanggal || '';
    if (elements.kegiatanWaktu) elements.kegiatanWaktu.value = draft.waktu || '';
    if (elements.kegiatanAlamat) elements.kegiatanAlamat.value = draft.alamat || '';
    if (elements.kegiatanPelapor) elements.kegiatanPelapor.value = draft.pelapor || '';
    
    // Restore state global
    appState.currentStep = draft.currentStep || 1;
    appState.selectedTemplate = draft.selectedTemplate || '2-landscape';
    appState.photos = draft.photos || {};
    appState.photoCaptions = draft.photoCaptions || {};
    appState.photoTransforms = draft.photoTransforms || {};
    appState.photoAspectRatios = draft.photoAspectRatios || {};
    appState.pdfPhotoFit = draft.pdfPhotoFit || 'cover';
    appState.pdfPhotoSize = draft.pdfPhotoSize || 'normal';
    appState.coordinates = draft.coordinates || null;
    appState.address = draft.address || '';
    
    // Sinkronkan UI Koordinat GPS
    if (appState.coordinates && elements.coordsContainer && elements.latVal && elements.lngVal) {
      elements.latVal.textContent = Number(appState.coordinates.lat).toFixed(6);
      elements.lngVal.textContent = Number(appState.coordinates.lng).toFixed(6);
      elements.coordsContainer.classList.remove('hidden');
    } else if (elements.coordsContainer) {
      elements.coordsContainer.classList.add('hidden');
    }
    
    // Sinkronkan Dropdown Settings PDF
    if (elements.pdfPhotoFit) elements.pdfPhotoFit.value = appState.pdfPhotoFit;
    if (elements.pdfPhotoSize) elements.pdfPhotoSize.value = appState.pdfPhotoSize;
    
    // Tampilkan tombol "Mulai Baru"
    if (elements.btnResetDraft) {
      elements.btnResetDraft.classList.remove('hidden');
    }
    
    return true;
  } catch (e) {
    console.error('Gagal memuat draf laporan:', e);
    return false;
  }
};

window.hapusDraftLaporan = function() {
  try {
    localStorage.removeItem(DRAFT_KEY);
    
    // Reset input form
    if (elements.kegiatanNama) elements.kegiatanNama.value = '';
    if (elements.kegiatanAlamat) elements.kegiatanAlamat.value = '';
    
    // Reset DateTime
    if (typeof initDateTime === 'function') {
      initDateTime();
    }
    
    // Reset state
    appState.currentStep = 1;
    appState.selectedTemplate = '2-landscape';
    appState.photos = {};
    appState.photoCaptions = {};
    appState.photoTransforms = {};
    appState.photoAspectRatios = {};
    appState.pdfPhotoFit = 'cover';
    appState.pdfPhotoSize = 'normal';
    appState.coordinates = null;
    appState.address = '';
    
    // Sembunyikan koordinat GPS
    if (elements.coordsContainer) {
      elements.coordsContainer.classList.add('hidden');
    }
    
    // Muat nama pelapor tersimpan (jika ada) sebagai default
    const savedPelapor = muatPelaporTersimpan();
    if (elements.kegiatanPelapor) {
      elements.kegiatanPelapor.value = savedPelapor;
    }
    
    // Sinkronkan pilihan template di UI
    const cards = document.querySelectorAll('.template-card');
    cards.forEach(card => {
      card.classList.remove('selected');
      if (card.dataset.template === appState.selectedTemplate) {
        card.classList.add('selected');
      }
    });
    
    // Sembunyikan tombol "Mulai Baru"
    if (elements.btnResetDraft) {
      elements.btnResetDraft.classList.add('hidden');
    }
    
    // Render ulang slot foto kosong
    if (typeof renderPhotoSlots === 'function') {
      renderPhotoSlots();
    }
    
    // Kembalikan ke step 1
    if (typeof goToStep === 'function') {
      goToStep(1);
    }
    
    showToast('Laporan baru telah dimulai. Draf lama dihapus.', 'success');
  } catch (e) {
    console.error('Gagal menghapus draf laporan:', e);
  }
};

window.bersihkanDraftStorageOnly = function() {
  try {
    localStorage.removeItem(DRAFT_KEY);
    if (elements.btnResetDraft) {
      elements.btnResetDraft.classList.add('hidden');
    }
  } catch (e) {
    console.warn('Gagal membersihkan draf storage:', e);
  }
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
