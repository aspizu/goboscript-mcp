import {Server as Engine} from "@socket.io/bun-engine"
import {Server, Socket} from "socket.io"

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

// Singleton for managing the active TurboWarp bridge connection
class TurboWarpConnectionManager {
    private activeSocket: Socket<ServerToClientEvents, ClientToServerEvents> | null =
        null

    getActiveSocket(): Socket<ServerToClientEvents, ClientToServerEvents> | null {
        return this.activeSocket
    }

    setActiveSocket(socket: Socket<ServerToClientEvents, ClientToServerEvents>): void {
        // Disconnect any existing connection
        if (this.activeSocket && this.activeSocket.connected) {
            this.activeSocket.disconnect()
        }
        this.activeSocket = socket
    }

    clearActiveSocket(): void {
        this.activeSocket = null
    }
}

export const turboWarpManager = new TurboWarpConnectionManager()

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
    // Only allow one active connection
    const existingSocket = turboWarpManager.getActiveSocket()
    if (existingSocket && existingSocket.connected) {
        socket.disconnect()
        return
    }

    turboWarpManager.setActiveSocket(socket)

    socket.on("loadProject", (path, ack) => {
        // TODO: implement project loading
        ack(true)
    })

    socket.on("startProject", (ack) => {
        // TODO: implement project start
        ack(true)
    })

    socket.on("stopProject", (ack) => {
        // TODO: implement project stop
        ack(true)
    })

    socket.on("disconnect", () => {
        turboWarpManager.clearActiveSocket()
    })
})
