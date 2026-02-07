import {Server as Engine} from "@socket.io/bun-engine"
import {Server} from "socket.io"

/** Severity level for project log messages. */
export type LogLevel = "log" | "warn" | "error"

/** A block execution event emitted by the running project. */
export interface BlockExecutedEvent {
    level: LogLevel
    params: string[]
}

/** Events sent from the server to connected clients. */
export interface ServerToClientEvents {
    /** A block was executed in the running project. */
    blockExecuted: (event: BlockExecutedEvent) => void
    /** The project has terminated. */
    projectTerminated: () => void
}

/** Events sent from a client to the server. */
export interface ClientToServerEvents {
    /** Load a project from an absolute .sb3 path. Ack resolves on success. */
    loadProject: (path: string, ack: (ok: boolean, error?: string) => void) => void
    /** Start the currently loaded project. Ack resolves on success. */
    startProject: (ack: (ok: boolean, error?: string) => void) => void
    /** Stop the currently running project. Ack resolves on success. */
    stopProject: (ack: (ok: boolean, error?: string) => void) => void
}

/** Events used for inter-server communication (unused for now). */
export interface InterServerEvents {}

/** Per-socket data store. */
export interface SocketData {}

// Initialize Socket.IO with Bun engine
export const io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
>({
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

    socket.on("loadProject", (path, ack) => {
        console.log(`loadProject: ${path}`)
        // TODO: implement project loading
        ack(true)
    })

    socket.on("startProject", (ack) => {
        console.log("startProject")
        // TODO: implement project start
        ack(true)
    })

    socket.on("stopProject", (ack) => {
        console.log("stopProject")
        // TODO: implement project stop
        ack(true)
    })

    socket.on("disconnect", () => {
        console.log(`Socket.IO client disconnected: ${socket.id}`)
    })
})
