package main

import (
	"html/template"
	"io/fs"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

type PageData struct {
	Images []string
	// Add indices to make navigation easier
	ImagesWithIndices []ImageWithIndex
	// Pagination data
	CurrentPage int
	TotalPages  int
	ImagesPerPage int
}

type ImageWithIndex struct {
	Path  string
	Index int
}

func main() {
	// Create the pictures directory if it doesn't exist
	if _, err := os.Stat("pictures"); os.IsNotExist(err) {
		err := os.Mkdir("pictures", 0755)
		if err != nil {
			log.Fatal("Failed to create pictures directory:", err)
		}
	}
	
	// Add template functions
	funcMap := template.FuncMap{
		"add": func(a, b int) int {
			return a + b
		},
		"subtract": func(a, b int) int {
			return a - b
		},
	}

	// Serve static files
	http.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("static"))))
	
	// Serve images from the pictures directory
	http.Handle("/pictures/", http.StripPrefix("/pictures/", http.FileServer(http.Dir("pictures"))))

	// Handle the main page
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/" {
			http.NotFound(w, r)
			return
		}

		// Get all images from the pictures directory
		images, err := getImages("pictures")
		if err != nil {
			http.Error(w, "Failed to read images", http.StatusInternalServerError)
			return
		}

		// Render the template with function map
		tmpl, err := template.New("index.html").Funcs(funcMap).ParseFiles("templates/index.html")
		if err != nil {
			http.Error(w, "Failed to load template", http.StatusInternalServerError)
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

		// Create images with indices for navigation
		imagesWithIndices := make([]ImageWithIndex, len(pageImages))
		for i, img := range pageImages {
			// Global index for navigation in fullscreen mode
			globalIndex := startIdx + i
			imagesWithIndices[i] = ImageWithIndex{
				Path:  img,
				Index: globalIndex,
			}
		}

		data := PageData{
			Images:           images,
			ImagesWithIndices: imagesWithIndices,
			CurrentPage:      page,
			TotalPages:       totalPages,
			ImagesPerPage:    imagesPerPage,
		}

		err = tmpl.Execute(w, data)
		if err != nil {
			http.Error(w, "Failed to render template", http.StatusInternalServerError)
			return
		}
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

	return images, err
}
