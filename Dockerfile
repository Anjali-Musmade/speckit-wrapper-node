FROM node:20-bullseye-slim

# Install system deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl build-essential git ca-certificates pkg-config libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Rust toolchain (required for spec-kit-mcp build)
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

# Install spec-kit-mcp MCP server
RUN cargo install spec-kit-mcp

WORKDIR /app

# Install Node dependencies
COPY package.json .
RUN npm install

# Install MCP JS SDK from GitHub (official STDIO client)
RUN npm install github:modelcontextprotocol/typescript-sdk

# Copy application
COPY . .

EXPOSE 3000
CMD ["node", "server.js"]
