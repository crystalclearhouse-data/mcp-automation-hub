# ─── Base: official Node LTS on Debian slim ───────────────────────────────────
FROM node:22-slim

# System packages needed for native modules + dev comfort
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    bash \
    jq \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm globally (matches what the project uses)
RUN npm install -g pnpm

# Create workspace directory owned by the node user
RUN mkdir -p /workspace && chown node:node /workspace

WORKDIR /workspace

# Switch to non-root user (safer, matches VS Code devcontainer conventions)
USER node

# Container stays alive for VS Code to attach
CMD ["sleep", "infinity"]
