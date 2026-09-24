FROM node:22-bookworm

WORKDIR /app

# Install FFmpeg, Python and yt-dlp
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ffmpeg \
        python3 \
        python3-venv \
        ca-certificates \
        curl \
    && python3 -m venv /opt/yt-dlp \
    && /opt/yt-dlp/bin/pip install --no-cache-dir --upgrade pip yt-dlp \
    && ln -sf /opt/yt-dlp/bin/yt-dlp /usr/local/bin/yt-dlp \
    && rm -rf /var/lib/apt/lists/*

# Check that everything installed correctly
RUN ffmpeg -version >/dev/null \
    && yt-dlp --version \
    && python3 --version

# Install Node dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy bot files
COPY . .

# Start bot
CMD ["npm", "start"]