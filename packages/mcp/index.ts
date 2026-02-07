import {turboWarpBridge} from "@goboscript/socket"
import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js"
import {StdioServerTransport} from "@modelcontextprotocol/sdk/server/stdio.js"
import {$, JSON5} from "bun"
import {err, fromAsyncThrowable, ok, Result} from "neverthrow"
import * as FS from "node:fs/promises"
import * as Path from "node:path"
import {z} from "zod"

type McpContent = Array<{type: "text"; text: string}>
type Socket = NonNullable<typeof turboWarpBridge.socket>

interface ToolResponse {
    content: McpContent
    [key: string]: unknown
}

export const mcpServer = new McpServer(
    {name: "goboscript-mcp", version: "1.0.0"},
    {capabilities: {tools: {}, resources: {}}},
)

export async function startMCPServer() {
    const transport = new StdioServerTransport()
    await mcpServer.connect(transport)
}

function createSuccessResponse(message: string): ToolResponse {
    return {
        content: [{type: "text", text: message}],
    }
}

function createErrorResponse(message: string): ToolResponse {
    return {
        content: [{type: "text", text: `Error: ${message}`}],
    }
}

function createMultiResponse(messages: string[]): ToolResponse {
    return {
        content: messages.map((text) => ({type: "text" as const, text})),
    }
}

function getActiveSocket(): Result<Socket, ToolResponse> {
    const activeSocket = turboWarpBridge.socket
    if (!activeSocket || !activeSocket.connected) {
        return err(
            createErrorResponse(
                "No TurboWarp bridge is currently connected. Is Turbowarp open?",
            ),
        )
    } else {
        return ok(activeSocket)
    }
}

function validateProjectLoaded(): ToolResponse | null {
    if (!turboWarpBridge.projectPath) {
        return createErrorResponse(
            "No project is currently loaded in the TurboWarp bridge. Use the load tool to load a .sb3 file first.",
        )
    }
    return null
}

async function validateFileExists(path: string): Promise<ToolResponse | null> {
    const stat = await fromAsyncThrowable(FS.stat)(path)
    if (stat.isErr() || !stat.value.isFile()) {
        return createErrorResponse(`File does not exist at path: ${path}`)
    }
    return null
}

mcpServer.registerTool(
    "buildProject",
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
        const result = await $`goboscript build ${path}`
        const stdout = result.stdout.toString("utf-8")
        const stderr = result.stderr.toString("utf-8")
        const success = result.exitCode === 0

        const messages: string[] = []

        if (success) {
            messages.push(
                `Build successfully created at: ${path}/${Path.basename(path)}.sb3`,
            )
        } else {
            messages.push("Build failed")
        }

        if (stdout) {
            messages.push(`Output:\n${stdout}`)
        }

        if (stderr) {
            messages.push(`Errors:\n${stderr}`)
        }

        return createMultiResponse(messages)
    },
)

async function request<T>(
    promise: Promise<{ok: true; value: T} | {ok: false; error: string}>,
): Promise<Result<T, string>> {
    const result = await promise
    if (result.ok) {
        return ok(result.value)
    } else {
        return err(result.error)
    }
}

mcpServer.registerTool(
    "loadProject",
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
        const socketResult = getActiveSocket()
        if (socketResult.isErr()) return socketResult.error
        const socket = socketResult.value

        const fileError = await validateFileExists(path)
        if (fileError) return fileError

        turboWarpBridge.projectPath = path
        turboWarpBridge.events.length = 0

        const result = await request(socket.emitWithAck("loadProject", path))

        if (result.isOk()) {
            return createSuccessResponse(`Successfully loaded project: ${path}`)
        } else {
            return createErrorResponse(`Failed to load project: ${result.error}`)
        }
    },
)

mcpServer.registerTool(
    "startProject",
    {
        description:
            "Start the currently loaded project in the connected TurboWarp bridge",
        inputSchema: {},
    },
    async () => {
        const socketResult = getActiveSocket()
        if (socketResult.isErr()) return socketResult.error
        const socket = socketResult.value

        const projectError = validateProjectLoaded()
        if (projectError) return projectError

        turboWarpBridge.events.length = 0

        const result = await request(socket.emitWithAck("startProject"))

        if (result.isOk()) {
            return createSuccessResponse(
                "Project started successfully in TurboWarp bridge.",
            )
        } else {
            return createErrorResponse(`Failed to start project: ${result.error}`)
        }
    },
)

mcpServer.registerTool(
    "stopProject",
    {
        description:
            "Stop the currently running project in the connected TurboWarp bridge",
        inputSchema: {},
    },
    async () => {
        const socketResult = getActiveSocket()
        if (socketResult.isErr()) return socketResult.error
        const socket = socketResult.value

        const result = await request(socket.emitWithAck("stopProject"))
        if (result.isOk()) {
            return createSuccessResponse(
                "Project stopped successfully in TurboWarp bridge.",
            )
        } else {
            return createErrorResponse(`Failed to stop project: ${result.error}`)
        }
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
        const socketResult = getActiveSocket()
        if (socketResult.isErr()) return socketResult.error
        const socket = socketResult.value

        const events = turboWarpBridge.events
            .slice(-(skip + limit)) // Get last (skip + limit) items
            .slice(skip) // Skip the first 'skip' items
            .reverse() // Reverse to get newest first

        const remaining = turboWarpBridge.events.length - skip - events.length

        const page =
            events
                .map((event) =>
                    JSON5.stringify({...event, value: JSON5.parse(event.value)}),
                )
                .join("\n") + "\n"

        const message = `[events in reverse chronological order]\n${page}${remaining > 0 ? `...and ${remaining} more events` : "[end of event log]"}`

        return createSuccessResponse(message)
    },
)

mcpServer.registerTool(
    "setVariable",
    {
        description:
            "Set a global variable in the currently running project. The variable MUST be defined in the stage.gs file.",
        inputSchema: {
            sprite: z
                .string()
                .min(1)
                .describe(
                    "Name of the sprite the variable belongs to (stage for stage.gs)",
                ),
            name: z.string().min(1).describe("Name of the variable to set"),
            value: z.string().describe("Value to set the variable to"),
        },
    },
    async ({sprite, name, value}) => {
        const socketResult = getActiveSocket()
        if (socketResult.isErr()) return socketResult.error
        const socket = socketResult.value

        const projectError = validateProjectLoaded()
        if (projectError) return projectError

        const result = await request(
            socket.emitWithAck("setVariable", sprite, name, value),
        )
        if (result.isOk()) {
            return createSuccessResponse(
                `Variable set successfully in TurboWarp bridge.`,
            )
        } else {
            return createErrorResponse(`Failed to set variable: ${result.error}`)
        }
    },
)

mcpServer.registerTool(
    "getVariable",
    {
        description:
            "Get the value of a global variable in the currently running project. The variable MUST be defined in the stage.gs file.",
        inputSchema: {
            sprite: z
                .string()
                .min(1)
                .describe(
                    "Name of the sprite the variable belongs to (stage for stage.gs)",
                ),
            name: z.string().min(1).describe("Name of the variable to get"),
        },
    },
    async ({sprite, name}) => {
        const socketResult = getActiveSocket()
        if (socketResult.isErr()) return socketResult.error
        const socket = socketResult.value

        const projectError = validateProjectLoaded()
        if (projectError) return projectError

        const result = await request(socket.emitWithAck("getVariable", sprite, name))
        if (result.isOk()) {
            return createSuccessResponse(
                `The value of the variable ${name} is: ${result.value}`,
            )
        } else {
            return createErrorResponse(`Failed to get variable: ${result.error}`)
        }
    },
)
