// Track the current image index and total images
let currentImageIndex = 0;
let totalImages = 0;
let allImages = [];

// Initialize the image array when the page loads
document.addEventListener('DOMContentLoaded', function() {
    allImages = Array.from(document.querySelectorAll('.gallery-image'));
    // Get the total images from the first image's data attribute
    // This is the global count, not just the images on this page
    if (allImages.length > 0) {
        totalImages = parseInt(allImages[0].dataset.total);
        
        // Detect the aspect ratio of the first image and apply it to all grid items
        detectAndApplyAspectRatio();
    } else {
        totalImages = 0;
    }
});

function detectAndApplyAspectRatio() {
    if (allImages.length === 0) return;
    
    const firstImage = allImages[0];
    
    // Create a temporary image element to get the actual dimensions
    const tempImg = new Image();
    tempImg.src = firstImage.src;
    
    tempImg.onload = function() {
        const aspectRatio = tempImg.width / tempImg.height;
        const aspectRatioPercentage = (1 / aspectRatio) * 100;
        
        // Apply the aspect ratio to all image items
        const imageItems = document.querySelectorAll('.image-item');
        imageItems.forEach(item => {
            item.style.aspectRatio = aspectRatio.toString();
            // Also set a fallback for browsers that don't support aspect-ratio property
            item.style.paddingBottom = aspectRatioPercentage + '%';
        });
        
        console.log('Applied aspect ratio:', aspectRatio, 'to all image grid items');
    };
    
    tempImg.onerror = function() {
        console.error('Failed to load image for aspect ratio detection');
    };
}

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
