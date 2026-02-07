import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js"
import {StdioServerTransport} from "@modelcontextprotocol/sdk/server/stdio.js"
import {z} from "zod"

// Initialize MCP server
export const mcpServer = new McpServer(
    {
        name: "goboscript-mcp",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
            resources: {},
        },
    },
)

// Example MCP tool
mcpServer.registerTool(
    "echo",
    {
        description: "Echoes back the input text",
        inputSchema: {
            text: z.string().describe("Text to echo back"),
        },
    },
    async ({text}) => {
        return {
            content: [
                {
                    type: "text",
                    text: `Echo: ${text}`,
                },
            ],
        }
    },
)

// Start MCP server on stdio
export async function startMCPServer() {
    const transport = new StdioServerTransport()
    await mcpServer.connect(transport)
    console.log("MCP server running on stdio")
}
