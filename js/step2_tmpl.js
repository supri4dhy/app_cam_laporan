// Logika Step 2: Pemilihan Grid Template Layout Laporan

function initTemplates() {
  const cards = document.querySelectorAll('.template-card');
  cards.forEach(card => {
    // Tandai template default di UI
    if (card.dataset.template === appState.selectedTemplate) {
      card.classList.add('selected');
    }
    
    card.addEventListener('click', () => {
      // Hapus pilihan sebelumnya
      cards.forEach(c => c.classList.remove('selected'));
      // Pilih yang diklik
      card.classList.add('selected');
      appState.selectedTemplate = card.dataset.template;
      
      // Reset foto karena template berganti susunan
      appState.photos = {};
      appState.photoCaptions = {}; // Reset caption kustom
      appState.photoTransforms = {}; // Reset transform
      
      // Render ulang slot foto di Step 3
      renderPhotoSlots();
    });
  });
}
