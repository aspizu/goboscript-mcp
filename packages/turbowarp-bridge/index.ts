import {io, type Socket} from "socket.io-client"
import type {ClientToServerEvents, ServerToClientEvents} from "../socket/socket"

const mcpServerUrl = "http://127.0.0.1:3000"

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(mcpServerUrl, {
    transports: ["websocket"],
    upgrade: false,
})

socket.on("connect", () => {
    console.log("[turbowarp-bridge] Connected to MCP server")
})

socket.on("disconnect", () => {
    console.log("[turbowarp-bridge] Disconnected from MCP server")
})

socket.on("loadProject", async (path, ack) => {
    try {
        const response = await fetch(`${mcpServerUrl}/project.sb3`)
        const file = await response.arrayBuffer()
        await vm.loadProject(file)
        console.log(`[turbowarp-bridge] loaded ${path} (${file.byteLength} bytes)`)
        ack(true)
    } catch (error) {
        console.error("[turbowarp-bridge] Failed to load project", error)
        ack(false, error instanceof Error ? error.message : String(error))
    }
})

socket.on("startProject", (ack) => {
    try {
        vm.greenFlag()
        console.log("[turbowarp-bridge] started project")
        ack(true)
    } catch (error) {
        console.error("[turbowarp-bridge] Failed to start project", error)
        ack(false, error instanceof Error ? error.message : String(error))
    }
})

socket.on("stopProject", (ack) => {
    try {
        vm.stopAll()
        console.log("[turbowarp-bridge] stopped project")
        ack(true)
    } catch (error) {
        console.error("[turbowarp-bridge] Failed to stop project", error)
        ack(false, error instanceof Error ? error.message : String(error))
    }
})

function onLog({content}: {content: any}) {
    socket.emit("blockExecuted", {
        level: "log",
        value: content,
        type: typeof content,
    })
}

function onWarn({content}: {content: any}) {
    socket.emit("blockExecuted", {
        level: "warn",
        value: content,
        type: typeof content,
    })
}

function onError({content}: {content: any}) {
    socket.emit("blockExecuted", {
        level: "error",
        value: content,
        type: typeof content,
    })
}

function interceptBlock(opcode: string, callback: (...args: any[]) => void) {
    const block = vm.runtime.getAddonBlock(opcode)
    if (!block) {
        console.error(`[turbowarp-bridge] Block with opcode "${opcode}" not found`)
    }
    const originalCallback = block.callback
    block.callback = (...args) => {
        callback(...args)
        return originalCallback(...args)
    }
}

let injected = false
vm.runtime.on("PROJECT_LOADED", () => {
    if (injected) return
    injected = true
    interceptBlock("\u200B\u200Blog\u200B\u200B %s", onLog)
    interceptBlock("\u200B\u200Bwarn\u200B\u200B %s", onWarn)
    interceptBlock("\u200B\u200Berror\u200B\u200B %s", onError)
})
