import {io, type Socket} from "socket.io-client"
import type {ClientToServerEvents, ServerToClientEvents} from "../socket/socket"

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
    "http://127.0.0.1:3000",
    {protocols: ["websocket"]},
)

socket.on("connect", () => {
    console.log("turbowarp-bridge: Connected to MCP server")
})

socket.on("disconnect", () => {
    console.log("turbowarp-bridge: Disconnected from MCP server")
})
