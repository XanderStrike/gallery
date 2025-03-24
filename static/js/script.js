function openFullscreen(img) {
    const fullscreenContainer = document.getElementById('fullscreen-container');
    const fullscreenImage = document.getElementById('fullscreen-image');
    
    fullscreenImage.src = img.src;
    fullscreenImage.alt = img.alt;
    
    fullscreenContainer.style.display = 'flex';
    
    // Prevent scrolling when fullscreen is active
    document.body.style.overflow = 'hidden';
}

function closeFullscreen() {
    const fullscreenContainer = document.getElementById('fullscreen-container');
    fullscreenContainer.style.display = 'none';
    
    // Re-enable scrolling
    document.body.style.overflow = 'auto';
}

// Close fullscreen view when clicking outside the image
document.getElementById('fullscreen-container').addEventListener('click', function(e) {
    if (e.target === this) {
        closeFullscreen();
    }
});

// Close fullscreen view when pressing Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeFullscreen();
    }
});
