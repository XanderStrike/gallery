FROM golang:1.21-alpine AS builder

WORKDIR /app

# Copy go.mod and go.sum files (if they exist)
COPY go.mod* go.sum* ./

# Download dependencies (if go.mod exists)
RUN if [ -f go.mod ]; then go mod download; fi

# Copy the source code
COPY . .

# Build the application
RUN go build -o image-gallery .

# Use a smaller image for the final container
FROM alpine:latest

WORKDIR /app

# Install necessary packages
RUN apk --no-cache add ca-certificates

# Copy the binary from the builder stage
COPY --from=builder /app/image-gallery /app/

# Copy static files and templates
COPY --from=builder /app/static /app/static
COPY --from=builder /app/templates /app/templates

# Create pictures directory
RUN mkdir -p /app/pictures

# Expose port 8080
EXPOSE 8080

# Set the working directory to /app
WORKDIR /app

# Run the application
CMD ["./image-gallery"]
