import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js"
import {StdioServerTransport} from "@modelcontextprotocol/sdk/server/stdio.js"
import {$} from "bun"
import {z} from "zod"
import {turboWarpManager} from "@goboscript/socket"

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

// Build tool
mcpServer.registerTool(
    "build",
    {
        description: "Build the goboscript project into a .sb3 file",
        inputSchema: {
            path: z
                .string()
                .min(1)
                .describe(
                    "Path to the project directory. Cannot build single .gs files.",
                ),
        },
    },
    async ({path}) => {
        // Run build command and capture both stdout and stderr
        const result = await $`goboscript build ${path}`
        const stdout = result.stdout.toString("utf-8")
        const stderr = result.stderr.toString("utf-8")
        const success = result.exitCode === 0

        const content = [
            {
                type: "text" as const,
                text: `Build ${success ? "succeeded" : "failed"} for path: ${path}`,
            },
        ]

        if (stdout) {
            content.push({
                type: "text" as const,
                text: `Output:\n${stdout}`,
            })
        }

        if (stderr) {
            content.push({
                type: "text" as const,
                text: `Errors:\n${stderr}`,
            })
        }

        return {content}
    },
)

// Load project tool
mcpServer.registerTool(
    "loadProject",
    {
        description: "Load a .sb3 project file in the connected TurboWarp bridge",
        inputSchema: {
            path: z.string().min(1).describe("Absolute path to the .sb3 project file"),
        },
    },
    async ({path}) => {
        const activeSocket = turboWarpManager.getActiveSocket()

        if (!activeSocket || !activeSocket.connected) {
            return {
                content: [
                    {
                        type: "text",
                        text: "Error: No TurboWarp bridge is currently connected",
                    },
                ],
            }
        }

        return new Promise((resolve) => {
            activeSocket.emit("loadProject", path, (ok: boolean, error?: string) => {
                if (ok) {
                    resolve({
                        content: [
                            {
                                type: "text",
                                text: `Successfully loaded project: ${path}`,
                            },
                        ],
                    })
                } else {
                    resolve({
                        content: [
                            {
                                type: "text",
                                text: `Failed to load project: ${error || "Unknown error"}`,
                            },
                        ],
                    })
                }
            })
        })
    },
)

// Start MCP server on stdio
export async function startMCPServer() {
    const transport = new StdioServerTransport()
    await mcpServer.connect(transport)
}
