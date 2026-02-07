import JSON5 from "json5"
import {io, type Socket} from "socket.io-client"
import type {
    ClientToServerEvents,
    LogLevel,
    ServerToClientEvents,
} from "../socket/socket"

const mcpServerUrl = "http://127.0.0.1:3000"

function ok<T>(value: T): {ok: true; value: T} {
    return {ok: true, value}
}

function err(error: unknown): {ok: false; error: string} {
    return {ok: false, error: error instanceof Error ? error.message : String(error)}
}

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
        ack(ok(undefined))
    } catch (error) {
        console.error("[turbowarp-bridge] Failed to load project", error)
        ack(err(error))
    }
})

socket.on("startProject", (ack) => {
    try {
        vm.greenFlag()
        console.log("[turbowarp-bridge] started project")
        ack(ok(undefined))
    } catch (error) {
        console.error("[turbowarp-bridge] Failed to start project", error)
        ack(err(error))
    }
})

socket.on("stopProject", (ack) => {
    try {
        vm.stopAll()
        console.log("[turbowarp-bridge] stopped project")
        ack(ok(undefined))
    } catch (error) {
        console.error("[turbowarp-bridge] Failed to stop project", error)
        ack(err(error))
    }
})

function findSpriteID(spriteName: string): string | null {
    if (spriteName === "stage") {
        spriteName = "Stage"
    }
    for (const target of vm.runtime.targets) {
        if (target.sprite.name === spriteName) {
            return target.id
        }
    }
    return null
}

socket.on("setVariable", (sprite, name, value, ack) => {
    try {
        const spriteID = findSpriteID(sprite)
        if (!spriteID) {
            throw new Error(`Sprite "${sprite}" not found`)
        }
        vm.setVariableValue(spriteID, name, JSON5.parse(value))
        ack(ok(undefined))
    } catch (error) {
        console.error(
            `[turbowarp-bridge] Failed to set variable ${name} to ${value}`,
            error,
        )
        ack(err(error))
    }
})

socket.on("getVariable", (sprite, name, ack) => {
    try {
        const spriteID = findSpriteID(sprite)
        if (!spriteID) {
            throw new Error(`Sprite "${sprite}" not found`)
        }
        ack(ok(JSON5.stringify(vm.getVariableValue(spriteID, name))))
    } catch (error) {
        console.error(`[turbowarp-bridge] Failed to get variable ${name}`, error)
        ack(err(error))
    }
})

const blockIntercept =
    (level: LogLevel) =>
    ({content}: any, runtime: any) => {
        const sprite = runtime.thread.target.sprite.name
        socket.emit("blockExecuted", {
            sprite: sprite === "Stage" ? "stage" : sprite,
            level,
            value: JSON5.stringify(content),
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
    interceptBlock("\u200B\u200Blog\u200B\u200B %s", blockIntercept("log"))
    interceptBlock("\u200B\u200Bwarn\u200B\u200B %s", blockIntercept("warn"))
    interceptBlock("\u200B\u200Berror\u200B\u200B %s", blockIntercept("error"))
})
