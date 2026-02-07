# AGENTS.md

This file contains guidelines and commands for agentic coding agents working in the goboscript-mcp repository.

## Project Structure

This is a TypeScript monorepo using Bun workspaces with the following packages:

- `@goboscript/app` - CLI application that starts both MCP and Socket.IO servers
- `@goboscript/mcp` - Model Context Protocol (MCP) server implementation
- `@goboscript/socket` - Socket.IO server with Bun engine
- `@goboscript/turbowarp-bridge` - Browser development tool for connecting to the Socket.IO server

## Build, Test, and Lint Commands

### Dependencies

```bash
bun install              # Install all dependencies
```

### Development

```bash
bun run index.ts         # Run the main application from root
bunx goboscript start    # Start both MCP and Socket.IO servers
bunx goboscript start -H 0.0.0.0 -p 3000  # Start with custom host/port
```

### Building

```bash
cd packages/turbowarp-bridge && bun run build    # Build bridge to dist/turbowarp-bridge.js
```

### Formatting

```bash
bun run fmt             # Format all files using Prettier
bunx --bun prettier -uw . # Format all files (alternative)
```

### Type Checking

```bash
bunx tsc --noEmit       # Type check all packages
bunx tsc --noEmit --project packages/mcp/tsconfig.json  # Type check specific package
```

**Note**: This project does not have test commands configured. Add test scripts to package.json files if tests are added.

## Code Style Guidelines

### TypeScript Configuration

- Target: ESNext with latest features enabled
- Strict mode enabled with additional type safety flags
- `noUncheckedIndexedAccess`: true - always check for undefined when accessing arrays/objects
- `noImplicitOverride`: true - explicitly mark method overrides
- `verbatimModuleSyntax`: true - use explicit import/export syntax

### Import/Export Patterns

- Use `import/export` syntax with `.js` extensions for external dependencies (required by verbatimModuleSyntax)
- Use relative imports without file extensions for internal modules
- Export types separately using `export type` when possible
- Use workspace dependencies for inter-package communication (`@goboscript/package-name`)

Examples:

```typescript
import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js"
import {startMCPServer} from "@goboscript/mcp"
import type {SocketData} from "./socket"
```

### Formatting Rules (Prettier)

- Tab width: 4 spaces
- No semicolons
- No bracket spacing
- Experimental ternaries enabled
- Line width: 88 characters
- LF line endings

### Naming Conventions

- Files: `kebab-case.ts` (e.g., `socket-server.ts`)
- Variables/Functions: `camelCase`
- Types/Interfaces: `PascalCase`
- Constants: `SCREAMING_SNAKE_CASE`
- Events: `camelCase` for event names, `PascalCase` for event interfaces

### Error Handling

- Use async/await with proper error handling
- Implement acknowledgment callbacks for Socket.IO events with `(ok: boolean, error?: string) => void` signature
- Return structured error responses from MCP tools
- Use TypeScript's discriminated unions for event type safety

### Documentation

- Use JSDoc comments for complex functions and interfaces
- Document Socket.IO events with clear descriptions
- Export type definitions separately for better tree-shaking

### Package Development

- Each package should have its own `tsconfig.json` extending the root config
- Use workspace protocol for internal dependencies
- Keep packages focused on single responsibilities
- Export public APIs through the main `index.ts` file

### Socket.IO Patterns

- Define event interfaces in a centralized `socket.ts` file
- Use generic types for Socket.IO clients: `Socket<ServerToClientEvents, ClientToServerEvents>`
- Implement proper connection lifecycle with console logging
- Handle acknowledgments consistently

### MCP Tool Development

- Register tools using the `mcpServer.registerTool()` method
- Use Zod schemas for input validation
- Return content arrays with `{type: "text", text: string}` structure
- Export server instance and startup function separately

### Security Considerations

- CORS is currently set to "\*" - consider restricting in production
- Validate all input parameters using Zod schemas
- Sanitize file paths and user inputs in Socket.IO handlers
- Use environment variables for sensitive configuration
