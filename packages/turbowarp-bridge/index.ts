import {io, type Socket} from "socket.io-client"
import type {ClientToServerEvents, ServerToClientEvents} from "../socket/socket"

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
    "http://127.0.0.1:3000",
    {transports: ["websocket"], upgrade: false},
)

socket.on("connect", () => {
    console.log("turbowarp-bridge: Connected to MCP server")
})

socket.on("disconnect", () => {
    console.log("turbowarp-bridge: Disconnected from MCP server")
})

socket.on("loadProject", async (path, ack) => {
    try {
        const fileID = await EditorPreload.getInitialFile()
        if (fileID === null) {
            throw new Error("No project file found in EditorPreload")
        }
        const file = await EditorPreload.getFile(fileID)
        await vm.loadProject(file)
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
