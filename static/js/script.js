// Track the current image index and total images
let currentImageIndex = 0;
let totalImages = 0;
let allImages = [];
let currentPage = 1;
let totalPages = 1;
let imagesPerPage = 200;
let refreshInterval = null;
let isPageVisible = true;

// Function to get current page from URL
function getCurrentPageFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const page = urlParams.get('page');
    return page ? parseInt(page) : 1;
}

// Function to update URL with current page
function updateURL(page) {
    const url = new URL(window.location);
    url.searchParams.set('page', page);
    window.history.pushState({}, '', url);
}

// Function to fetch images from API
async function fetchImages(page) {
    try {
        const response = await fetch(`/api/images?page=${page}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching images:', error);
        return null;
    }
}

// Function to render images
function renderImages(images, startIndex) {
    const imageGrid = document.querySelector('.image-grid');
    
    if (images.length === 0) {
        imageGrid.innerHTML = '<p class="no-images">No images found in the pictures folder. Add some images to get started!</p>';
        return;
    }
    
    // Clear existing images
    imageGrid.innerHTML = '';
    
    // Create image elements
    images.forEach((imagePath, index) => {
        const globalIndex = startIndex + index;
        const imageItem = document.createElement('div');
        imageItem.className = 'image-item';
        
        const img = document.createElement('img');
        img.src = `/pictures/${imagePath}`;
        img.alt = imagePath;
        img.className = 'gallery-image';
        img.dataset.index = globalIndex;
        img.dataset.total = totalImages;
        img.onclick = function() { openFullscreen(this); };
        
        imageItem.appendChild(img);
        imageGrid.appendChild(imageItem);
    });
    
    // Update the allImages array for fullscreen navigation
    allImages = Array.from(document.querySelectorAll('.gallery-image'));
}

// Function to render pagination
function renderPagination() {
    const paginationContainer = document.querySelector('.pagination');
    
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    paginationContainer.innerHTML = '';
    
    // Previous button
    if (currentPage > 1) {
        const prevLink = document.createElement('a');
        prevLink.href = `/?page=${currentPage - 1}`;
        prevLink.className = 'page-link';
        prevLink.innerHTML = '&laquo; Previous';
        prevLink.onclick = function(e) {
            e.preventDefault();
            loadPage(currentPage - 1);
        };
        paginationContainer.appendChild(prevLink);
    } else {
        const prevSpan = document.createElement('span');
        prevSpan.className = 'page-link disabled';
        prevSpan.innerHTML = '&laquo; Previous';
        paginationContainer.appendChild(prevSpan);
    }
    
    // Page info
    const pageInfo = document.createElement('span');
    pageInfo.className = 'page-info';
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    paginationContainer.appendChild(pageInfo);
    
    // Next button
    if (currentPage < totalPages) {
        const nextLink = document.createElement('a');
        nextLink.href = `/?page=${currentPage + 1}`;
        nextLink.className = 'page-link';
        nextLink.innerHTML = 'Next &raquo;';
        nextLink.onclick = function(e) {
            e.preventDefault();
            loadPage(currentPage + 1);
        };
        paginationContainer.appendChild(nextLink);
    } else {
        const nextSpan = document.createElement('span');
        nextSpan.className = 'page-link disabled';
        nextSpan.innerHTML = 'Next &raquo;';
        paginationContainer.appendChild(nextSpan);
    }
}

// Function to load a specific page
async function loadPage(page) {
    currentPage = page;
    updateURL(page);
    
    const data = await fetchImages(page);
    if (!data) {
        return;
    }
    
    totalImages = data.totalImages;
    totalPages = data.totalPages;
    imagesPerPage = data.images.length;
    
    const startIndex = (page - 1) * imagesPerPage;
    
    renderImages(data.images, startIndex);
    renderPagination();
    
    // Detect and apply aspect ratio after images are loaded
    detectAndApplyAspectRatio();
}

// Function to handle page visibility changes
function handleVisibilityChange() {
    if (document.hidden) {
        // Page is not visible, stop refreshing
        isPageVisible = false;
        stopAutoRefresh();
        console.log('Page hidden - stopping auto-refresh');
    } else {
        // Page is visible, start refreshing
        isPageVisible = true;
        startAutoRefresh();
        console.log('Page visible - starting auto-refresh');
    }
    
    updateRefreshIndicator();
}

// Function to start auto-refresh
function startAutoRefresh() {
    if (refreshInterval) return;
    
    // Refresh immediately when page becomes visible
    loadPage(currentPage);
    
    // Then set up interval for subsequent refreshes
    refreshInterval = setInterval(() => {
        if (isPageVisible) {
            loadPage(currentPage);
        }
    }, 1000); // Refresh every second
    
    console.log('Auto-refresh started');
}

// Function to stop auto-refresh
function stopAutoRefresh() {
    if (!refreshInterval) return;
    
    clearInterval(refreshInterval);
    refreshInterval = null;
    
    console.log('Auto-refresh stopped');
}

// Function to update the refresh indicator
function updateRefreshIndicator() {
    const refreshIndicator = document.getElementById('refresh-indicator');
    
    if (isPageVisible && refreshInterval) {
        refreshIndicator.classList.add('active');
    } else {
        refreshIndicator.classList.remove('active');
    }
}

// Initialize the gallery when the page loads
document.addEventListener('DOMContentLoaded', function() {
    currentPage = getCurrentPageFromURL();
    loadPage(currentPage);
    
    // Set up Page Visibility API
    if (typeof document.hidden !== 'undefined') {
        // Start auto-refresh immediately since page is visible
        startAutoRefresh();
        
        // Listen for visibility changes
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        console.log('Page Visibility API supported - auto-refresh enabled');
    } else {
        console.log('Page Visibility API not supported - falling back to always-on refresh');
        // Fallback for browsers that don't support Page Visibility API
        startAutoRefresh();
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