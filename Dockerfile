FROM node:22-bookworm

WORKDIR /app

# Install FFmpeg and basic media libraries
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy package files first for better Docker caching
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy the rest of Crystal Bot
COPY . .

# Verify FFmpeg is available
RUN ffmpeg -version

# Start prime Bot
CMD ["npm", "start"]