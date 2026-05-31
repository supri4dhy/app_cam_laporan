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
  btnShareWa: document.getElementById('btn-share-wa')
};
