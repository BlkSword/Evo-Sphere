# Build stage
FROM golang:alpine AS builder

WORKDIR /app

# Install dependencies
RUN apk add --no-cache git

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the server
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o server ./cmd/server

# Runtime stage
FROM alpine:latest

WORKDIR /app

# Install ca-certificates for HTTPS
RUN apk --no-cache add ca-certificates tzdata

# Copy binary from builder
COPY --from=builder /app/server .

# Expose port
EXPOSE 8080

# Set timezone
ENV TZ=Asia/Shanghai

# Run the server
CMD ["./server"]
