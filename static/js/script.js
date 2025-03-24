// Track the current image index and total images
let currentImageIndex = 0;
let totalImages = 0;
let allImages = [];

// Initialize the image array when the page loads
document.addEventListener('DOMContentLoaded', function() {
    allImages = Array.from(document.querySelectorAll('.gallery-image'));
    totalImages = allImages.length;
});

function openFullscreen(img) {
    const fullscreenContainer = document.getElementById('fullscreen-container');
    const fullscreenImage = document.getElementById('fullscreen-image');
    const zoomLink = document.getElementById('zoom-link');
    
    fullscreenImage.src = img.src;
    fullscreenImage.alt = img.alt;
    
    // Update zoom link href
    zoomLink.href = img.src;
    
    // Set the current image index
    currentImageIndex = parseInt(img.dataset.index);
    totalImages = parseInt(img.dataset.total);
    
    fullscreenContainer.style.display = 'flex';
    
    // Prevent scrolling when fullscreen is active
    document.body.style.overflow = 'hidden';
}

function navigateImages(direction) {
    // Calculate the new index with wrapping
    let newIndex = (currentImageIndex + direction + totalImages) % totalImages;
    
    // Find the image at the new index
    const newImage = document.querySelector(`.gallery-image[data-index="${newIndex}"]`);
    if (newImage) {
        const fullscreenImage = document.getElementById('fullscreen-image');
        const zoomLink = document.getElementById('zoom-link');
        
        fullscreenImage.src = newImage.src;
        fullscreenImage.alt = newImage.alt;
        
        // Update zoom link href
        zoomLink.href = newImage.src;
        
        currentImageIndex = newIndex;
    }
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

// Handle keyboard navigation
document.addEventListener('keydown', function(e) {
    if (document.getElementById('fullscreen-container').style.display === 'flex') {
        switch (e.key) {
            case 'Escape':
                closeFullscreen();
                break;
            case 'ArrowLeft':
                navigateImages(-1); // Previous image
                break;
            case 'ArrowRight':
                navigateImages(1);  // Next image
                break;
        }
    }
});
