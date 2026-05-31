// Logika Voice Input (Speech-to-Text)

function initVoiceInput() {
  setupVoiceInput('btn-mic-nama', 'kegiatan-nama');
}

function setupVoiceInput(btnId, inputId) {
  const btnMic = document.getElementById(btnId);
  const textInput = document.getElementById(inputId);
  
  if (!btnMic || !textInput) return;
  
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
    const currentVal = textInput.value.trim();
    textInput.value = currentVal ? `${currentVal} ${transcript}` : transcript;
    
    // Picu event input untuk memperbarui pratinjau PDF secara otomatis
    textInput.dispatchEvent(new Event('input'));
  };
  
  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
    isListening = false;
    btnMic.classList.remove('recording');
    btnMic.innerHTML = '<i class="fa-solid fa-microphone"></i> Dikte';
    
    if (event.error === 'not-allowed') {
      showToast("Izin mikrofon ditolak. Silakan izinkan akses mikrofon di pengaturan browser Anda.", "warning");
    }
  };
  
  recognition.onend = () => {
    isListening = false;
    btnMic.classList.remove('recording');
    btnMic.innerHTML = '<i class="fa-solid fa-microphone"></i> Dikte';
  };
}
