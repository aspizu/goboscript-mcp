# GoBOScript MCP Server

This server runs both an MCP (Model Context Protocol) server and a Socket.IO server simultaneously using Bun.

## Setup

```bash
# Install dependencies
bun install

# Run the server
bun --hot index.ts
```

## Features

### Socket.IO Server

- Runs on `ws://localhost:3000`
- WebSocket-based real-time communication
- CORS enabled for all origins
- Echo message handler included as example

### MCP Server

- Runs on stdio (for MCP client connections)
- Includes example "echo" tool
- Compatible with MCP v1.x SDK

## Testing Socket.IO

1. **Via Web Browser:**
    - Open http://localhost:3000 in your browser
    - The test client allows you to send and receive messages
      -Type a message and click "Send" to test the connection

2. **Via curl:**

    ```bash
    curl "http://localhost:3000/socket.io/?EIO=4&transport=polling"
    ```

3. **Via Socket.IO Client:**

    ```typescript
    import {io} from "socket.io-client"

    const socket = io("http://localhost:3000")

    socket.on("connect", () => {
        console.log("Connected!")
        socket.emit("message", "Hello from client")
    })

    socket.on("message", (data) => {
        console.log("Received:", data)
    })
    ```

## Testing MCP

The MCP server communicates via stdio. Connect using an MCP client:

```bash
# The server expects MCP protocol messages on stdin
# and sends responses to stdout
```

Example tool available:

- **echo**: Echoes back the provided text

## Architecture

```
┌─────────────────────────────────────┐
│         Bun Server (Port 3000)      │
├─────────────────────────────────────┤
│                                     │
│  ┌──────────────┐  ┌─────────────┐ │
│  │  Socket.IO   │  │  HTTP/WS    │ │
│  │  Engine      │  │  Handler    │ │
│  └──────────────┘  └─────────────┘ │
│         │                 │         │
└─────────┼─────────────────┼─────────┘
          │                 │
          ▼                 ▼
    Socket.IO          HTML/HTTP
    Clients            Clients

┌─────────────────────────────────────┐
│         MCP Server (stdio)          │
├─────────────────────────────────────┤
│  • Tools: echo                      │
│  • Resources: (none yet)            │
│  • Prompts: (none yet)              │
└─────────────────────────────────────┘
          ▲
          │
     MCP Clients
```

## Files

- `index.ts` - Main server file
- `test-client.html` - Socket.IO test client
- `package.json` - Dependencies

## Dependencies

- `@modelcontextprotocol/sdk` - MCP SDK v1.x
- `socket.io` - Socket.IO server
- `@socket.io/bun-engine` - Bun-optimized Socket.IO engine
- `zod` - Schema validation (peer dependency for MCP SDK)
