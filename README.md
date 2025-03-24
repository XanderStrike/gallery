# Image Gallery

A simple web server that displays images from a directory in a minimalistic grid with fullscreen viewing capabilities.

## Quick Start

Run with Docker (using the current directory for images):

```bash
docker run -p 8080:8080 -v $(pwd):/app/pictures xanderstrike/gallery
```

Then open http://localhost:8080 in your browser.
