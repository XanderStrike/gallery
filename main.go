package main

import (
	"html/template"
	"io/fs"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

type PageData struct {
	Images []string
	// Add indices to make navigation easier
	ImagesWithIndices []ImageWithIndex
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

		// Render the template
		tmpl, err := template.ParseFiles("templates/index.html")
		if err != nil {
			http.Error(w, "Failed to load template", http.StatusInternalServerError)
			return
		}

		// Create images with indices for navigation
		imagesWithIndices := make([]ImageWithIndex, len(images))
		for i, img := range images {
			imagesWithIndices[i] = ImageWithIndex{
				Path:  img,
				Index: i,
			}
		}

		data := PageData{
			Images:           images,
			ImagesWithIndices: imagesWithIndices,
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
