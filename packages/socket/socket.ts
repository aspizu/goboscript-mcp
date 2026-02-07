import {Server as Engine} from "@socket.io/bun-engine"
import {Server} from "socket.io"

// Initialize Socket.IO with Bun engine
export const io = new Server({
    cors: {
        origin: "*",
    },
})

export const engine = new Engine({
    path: "/socket.io/",
})

io.bind(engine)

// Socket.IO connection handling
io.on("connection", (socket) => {
    console.log(`Socket.IO client connected: ${socket.id}`)

    socket.on("message", (data) => {
        console.log("Received message:", data)
        socket.emit("message", {echo: data, timestamp: Date.now()})
    })

    socket.on("disconnect", () => {
        console.log(`Socket.IO client disconnected: ${socket.id}`)
    })
})
