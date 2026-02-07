import {io, type Socket} from "socket.io-client"
import type {ClientToServerEvents, ServerToClientEvents} from "../socket/socket"

const mcpServerUrl = "http://127.0.0.1:3000"

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(mcpServerUrl, {
    transports: ["websocket"],
    upgrade: false,
})

socket.on("connect", () => {
    console.log("turbowarp-bridge: Connected to MCP server")
})

socket.on("disconnect", () => {
    console.log("turbowarp-bridge: Disconnected from MCP server")
})

socket.on("loadProject", async (path, ack) => {
    try {
        const response = await fetch(`${mcpServerUrl}/project.sb3`)
        const file = await response.arrayBuffer()
        await vm.loadProject(file)
        console.log(`turbowarp-bridge: loaded ${path} (${file.byteLength} bytes)`)
        ack(true)
    } catch (error) {
        console.error("turbowarp-bridge: Failed to load project", error)
        ack(false, error instanceof Error ? error.message : String(error))
    }
})

socket.on("startProject", (ack) => {
    try {
        vm.start()
        ack(true)
    } catch (error) {
        console.error("turbowarp-bridge: Failed to start project", error)
        ack(false, error instanceof Error ? error.message : String(error))
    }
})

socket.on("stopProject", (ack) => {
    try {
        vm.stopAll()
        ack(true)
    } catch (error) {
        console.error("turbowarp-bridge: Failed to stop project", error)
        ack(false, error instanceof Error ? error.message : String(error))
    }
})
