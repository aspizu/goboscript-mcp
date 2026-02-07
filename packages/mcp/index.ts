import {turboWarpBridge} from "@goboscript/socket"
import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js"
import {StdioServerTransport} from "@modelcontextprotocol/sdk/server/stdio.js"
import {$, JSON5} from "bun"
import * as FS from "node:fs/promises"
import * as Path from "node:path"
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

        const content = []

        if (success) {
            content.push({
                type: "text" as const,
                text: `Build successfully created at: ${path}/${Path.basename(path)}.sb3`,
            })
        } else {
            content.push({
                type: "text" as const,
                text: `Build failed`,
            })
        }

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
    "load",
    {
        description: "Load a .sb3 project file in the connected TurboWarp bridge",
        inputSchema: {
            path: z
                .string()
                .endsWith(".sb3")
                .min(1)
                .describe("Absolute path to the .sb3 project file"),
        },
    },
    async ({path}) => {
        const activeSocket = turboWarpBridge.socket

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

        if (!(await FS.stat(path)).isFile()) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Error: File does not exist at path: ${path}`,
                    },
                ],
            }
        }

        turboWarpBridge.projectPath = path
        turboWarpBridge.events.length = 0

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

// Start project tool
mcpServer.registerTool(
    "start",
    {
        description:
            "Start the currently loaded project in the connected TurboWarp bridge",
        inputSchema: {},
    },
    async () => {
        const activeSocket = turboWarpBridge.socket

        if (!activeSocket || !activeSocket.connected) {
            return {
                content: [
                    {
                        type: "text",
                        text: "Error: No TurboWarp bridge is currently connected.",
                    },
                ],
            }
        }

        if (!turboWarpBridge.projectPath) {
            return {
                content: [
                    {
                        type: "text",
                        text: "Error: No project is currently loaded in the TurboWarp bridge. Use the loadProject tool to load a .sb3 file first.",
                    },
                ],
            }
        }

        turboWarpBridge.events.length = 0

        return new Promise((resolve) => {
            activeSocket.emit("startProject", (ok: boolean, error?: string) => {
                if (ok) {
                    resolve({
                        content: [
                            {
                                type: "text",
                                text: "Project started successfully in TurboWarp bridge.",
                            },
                        ],
                    })
                } else {
                    resolve({
                        content: [
                            {
                                type: "text",
                                text: `Failed to start project: ${error || "Unknown error"}`,
                            },
                        ],
                    })
                }
            })
        })
    },
)

// Stop project tool
mcpServer.registerTool(
    "stop",
    {
        description:
            "Stop the currently running project in the connected TurboWarp bridge",
        inputSchema: {},
    },
    async () => {
        const activeSocket = turboWarpBridge.socket

        if (!activeSocket || !activeSocket.connected) {
            return {
                content: [
                    {
                        type: "text",
                        text: "Error: No TurboWarp bridge is currently connected.",
                    },
                ],
            }
        }

        return new Promise((resolve) => {
            activeSocket.emit("stopProject", (ok: boolean, error?: string) => {
                if (ok) {
                    resolve({
                        content: [
                            {
                                type: "text",
                                text: "Project stopped successfully in TurboWarp bridge.",
                            },
                        ],
                    })
                } else {
                    resolve({
                        content: [
                            {
                                type: "text",
                                text: `Failed to stop project: ${error || "Unknown error"}`,
                            },
                        ],
                    })
                }
            })
        })
    },
)

mcpServer.registerTool(
    "readConsole",
    {
        description:
            "Read events from the console. Events are generated by the project running log, warn, and error blocks.",
        inputSchema: {
            skip: z
                .number()
                .int()
                .min(0)
                .default(0)
                .describe("Number of events to skip from the end of the event log."),
            limit: z
                .number()
                .int()
                .min(1)
                .default(10)
                .describe("Maximum number of events to return."),
        },
    },
    async ({skip, limit}) => {
        const activeSocket = turboWarpBridge.socket

        if (!activeSocket || !activeSocket.connected) {
            return {
                content: [
                    {
                        type: "text",
                        text: "Error: No TurboWarp bridge is currently connected.",
                    },
                ],
            }
        }

        const events = turboWarpBridge.events
            .slice(-(skip + limit)) // Get last (skip + limit) items
            .slice(skip) // Skip the first 'skip' items
            .reverse() // Reverse to get newest first

        const remaining = turboWarpBridge.events.length - skip - events.length

        const page = events.map((event) => JSON5.stringify(event)).join("\n") + "\n"

        return {
            content: [
                {
                    type: "text",
                    text: `[events in reverse chronological order]\n${page}${remaining > 0 ? `...and ${remaining} more events` : "[end of event log]"}`,
                },
            ],
        }
    },
)

// Start MCP server on stdio
export async function startMCPServer() {
    const transport = new StdioServerTransport()
    await mcpServer.connect(transport)
}
