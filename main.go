package main

import (
	"encoding/json"
	"io/fs"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)



type APIResponse struct {
	Images      []string `json:"images"`
	CurrentPage int      `json:"currentPage"`
	TotalPages  int      `json:"totalPages"`
	TotalImages int      `json:"totalImages"`
}

func main() {
	// Create the pictures directory if it doesn't exist
	if _, err := os.Stat("pictures"); os.IsNotExist(err) {
		err := os.Mkdir("pictures", 0755)
		if err != nil {
			log.Fatal("Failed to create pictures directory:", err)
		}
	}
	
	// Serve static files
	http.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("static"))))
	
	// Serve images from the pictures directory
	http.Handle("/pictures/", http.StripPrefix("/pictures/", http.FileServer(http.Dir("pictures"))))

	// Handle API endpoint for getting images
	http.HandleFunc("/api/images", func(w http.ResponseWriter, r *http.Request) {
		// Get all images from the pictures directory
		images, err := getImages("pictures")
		if err != nil {
			http.Error(w, "Failed to read images", http.StatusInternalServerError)
			return
		}

		// Get page number from query parameter
		pageStr := r.URL.Query().Get("page")
		page := 1
		if pageStr != "" {
			if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
				page = p
			}
		}

		// Calculate pagination
		imagesPerPage := 200
		totalImages := len(images)
		totalPages := (totalImages + imagesPerPage - 1) / imagesPerPage

		// Ensure page is within bounds
		if page > totalPages && totalPages > 0 {
			page = totalPages
		}

		// Get images for current page
		startIdx := (page - 1) * imagesPerPage
		endIdx := startIdx + imagesPerPage
		if endIdx > totalImages {
			endIdx = totalImages
		}

		pageImages := images
		if totalImages > 0 {
			pageImages = images[startIdx:endIdx]
		}

		// Create response
		response := APIResponse{
			Images:      pageImages,
			CurrentPage: page,
			TotalPages:  totalPages,
			TotalImages: totalImages,
		}

		// Set JSON content type
		w.Header().Set("Content-Type", "application/json")

		// Encode and send JSON response
		if err := json.NewEncoder(w).Encode(response); err != nil {
			http.Error(w, "Failed to encode JSON response", http.StatusInternalServerError)
			return
		}
	})

	// Handle the main page - serve static HTML
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/" {
			http.NotFound(w, r)
			return
		}

		// Serve the static HTML file
		http.ServeFile(w, r, "templates/index.html")
	})

	// Start the server
	log.Println("Server starting on http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

// getImages returns a list of image filenames from the specified directory
func getImages(dir string) ([]string, error) {
	var images []string

	err := filepath.Walk(dir, func(path string, info fs.FileInfo, err error) error {
		if err != nil {
			return err
		}

		// Skip directories
		if info.IsDir() {
			return nil
		}

		// Check if the file is an image
		ext := strings.ToLower(filepath.Ext(path))
		if ext == ".jpg" || ext == ".jpeg" || ext == ".png" || ext == ".gif" || ext == ".webp" {
			// Convert path to URL format
			relativePath := strings.TrimPrefix(path, dir)
			relativePath = strings.TrimPrefix(relativePath, "/")
			images = append(images, relativePath)
		}

		return nil
	})

	// Reverse the order of images
	for i, j := 0, len(images)-1; i < j; i, j = i+1, j-1 {
		images[i], images[j] = images[j], images[i]
	}

	return images, err
}
