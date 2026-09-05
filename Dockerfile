FROM node:22-bookworm

WORKDIR /app

# Install system media tools
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ffmpeg \
        yt-dlp \
        python3 \
        python3-pip \
        ca-certificates \
        curl \
    && rm -rf /var/lib/apt/lists/*

# Verify required tools
RUN ffmpeg -version
RUN yt-dlp --version

# Copy package files first for Docker caching
COPY package*.json ./

# Install Node.js dependencies
RUN npm install --legacy-peer-deps

# Copy bot source
COPY . .

# Final verification
RUN ffmpeg -version
RUN yt-dlp --version

# Start PRIME Bot
CMD ["npm", "start"]