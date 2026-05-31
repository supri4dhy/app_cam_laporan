// Orchestrator Utama LaporCam App

// 1. Inisialisasi Aplikasi saat dokumen siap
document.addEventListener('DOMContentLoaded', () => {
  initDateTime();
  initEventListeners();
  initTemplates();
  renderPhotoSlots();
  initVoiceInput();
  initLogoUpload();
});

// 2. Event Listeners Global
function initEventListeners() {
  // Tombol deteksi GPS di Step 1
  if (elements.btnGps) {
    elements.btnGps.addEventListener('click', handleGPSDetection);
  }
  
  // Tombol aksi di Step 4
  if (elements.btnGeneratePdf) {
    elements.btnGeneratePdf.addEventListener('click', generatePDFReport);
  }
  if (elements.btnShareWa) {
    elements.btnShareWa.addEventListener('click', shareToWhatsApp);
  }

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

// 3. Logika Navigasi Wizard (Multi-step)
function navigateToStep(stepNumber) {
  if (stepNumber > appState.currentStep) {
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

// Validasi Form sebelum melangkah maju
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
    const totalPhotos = Object.keys(appState.photos).length;
    if (totalPhotos === 0) {
      return confirm("Anda belum menambahkan foto dokumentasi. Lanjutkan untuk melihat pratinjau?");
    }
  }
  
  return true;
}

// Transisi Langkah & Refresh State
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

  // Jika berpindah ke Step 4 (Pratinjau), siapkan layout pratinjau PDF
  if (stepNumber === 4) {
    preparePDFPreview();
  }
  
  // Scroll halaman ke atas agar nyaman di mobile
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Memperbarui UI Step Indikator (Desktop & Mobile Bottom Nav)
function updateStepIndicatorUI() {
  for (let i = 1; i <= 4; i++) {
    const dot = document.getElementById(`step-dot-${i}`);
    const line = document.getElementById(`step-line-${i}`);
    
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
    
    // Update mobile bottom navigation
    const mobileNavItem = document.getElementById(`mobile-nav-${i}`);
    if (mobileNavItem) {
      mobileNavItem.classList.remove('active');
      if (i === appState.currentStep) {
        mobileNavItem.classList.add('active');
      }
    }
  }
}

// 4. Global Loading Spinner Helpers
function showLoading(text) {
  if (elements.loadingText && elements.loadingOverlay) {
    elements.loadingText.textContent = text;
    elements.loadingOverlay.classList.remove('hidden');
  }
}

function hideLoading() {
  if (elements.loadingOverlay) {
    elements.loadingOverlay.classList.add('hidden');
  }
}

function getFormattedDateShort() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}

// 5. Logika Install Banner PWA (Shortcut Layar Utama)
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  // Cegah browser menampilkan prompt bawaan secara langsung
  e.preventDefault();
  // Simpan event agar bisa dipicu nanti
  deferredPrompt = e;
  
  // Tampilkan banner kustom di Step 1
  if (elements.pwaInstallBanner) {
    elements.pwaInstallBanner.classList.remove('hidden');
  }
});

// Daftarkan event listener untuk tombol aksi di banner PWA
if (elements.btnPwaInstall) {
  elements.btnPwaInstall.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    
    // Tampilkan prompt instalasi bawaan browser
    deferredPrompt.prompt();
    
    // Tunggu respons pilihan dari pengguna
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`Pilihan instalasi pengguna: ${outcome}`);
    
    // Bersihkan prompt deferred karena hanya bisa dipanggil sekali
    deferredPrompt = null;
    
    // Sembunyikan banner
    if (elements.pwaInstallBanner) {
      elements.pwaInstallBanner.classList.add('hidden');
    }
  });
}

if (elements.btnPwaDismiss) {
  elements.btnPwaDismiss.addEventListener('click', () => {
    // Sembunyikan banner jika pengguna memilih untuk menutupnya
    if (elements.pwaInstallBanner) {
      elements.pwaInstallBanner.classList.add('hidden');
    }
  });
}

// Sembunyikan banner secara otomatis setelah berhasil terinstall
window.addEventListener('appinstalled', (evt) => {
  console.log('LaporCam berhasil terinstal!');
  if (elements.pwaInstallBanner) {
    elements.pwaInstallBanner.classList.add('hidden');
  }
});
