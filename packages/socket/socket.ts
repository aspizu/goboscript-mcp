import {Server as Engine} from "@socket.io/bun-engine"
import {Server, Socket} from "socket.io"

/** Severity level for project log messages. */
export type LogLevel = "log" | "warn" | "error"

/** A block execution event emitted by the running project. */
export interface BlockExecutedEvent {
    level: LogLevel
    value: any
    type: string
}

/** Events sent from the server to connected clients. */
export interface ServerToClientEvents {
    /** Load a project from an absolute .sb3 path. Ack resolves on success. */
    loadProject: (path: string, ack: (ok: boolean, error?: string) => void) => void
    /** Start the currently loaded project. Ack resolves on success. */
    startProject: (ack: (ok: boolean, error?: string) => void) => void
    /** Stop the currently running project. Ack resolves on success. */
    stopProject: (ack: (ok: boolean, error?: string) => void) => void
}

/** Events sent from a client to the server. */
export interface ClientToServerEvents {
    /** A block was executed in the running project. */
    blockExecuted: (event: BlockExecutedEvent) => void
    /** The project has terminated. */
    projectTerminated: () => void
}

/** Events used for inter-server communication (unused for now). */
export interface InterServerEvents {}

/** Per-socket data store. */
export interface SocketData {}

// Singleton for managing the active TurboWarp bridge connection
class TurboWarpBridge {
    private __socket: Socket<ClientToServerEvents, ServerToClientEvents> | null = null
    public projectPath: string | null = null
    public events: BlockExecutedEvent[] = []

    get socket(): Socket<ClientToServerEvents, ServerToClientEvents> | null {
        return this.__socket
    }

    connect(socket: Socket<ClientToServerEvents, ServerToClientEvents>): void {
        // Disconnect any existing connection
        if (this.__socket && this.__socket.connected) {
            this.__socket.disconnect()
        }
        this.__socket = socket
    }

    disconnect(): void {
        this.__socket = null
        this.projectPath = null
    }
}

export const turboWarpBridge = new TurboWarpBridge()

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
    const existingSocket = turboWarpBridge.socket
    if (existingSocket && existingSocket.connected) {
        socket.disconnect()
        return
    }

    turboWarpBridge.connect(socket)

    socket.on("disconnect", () => {
        turboWarpBridge.disconnect()
    })

    socket.on("blockExecuted", (event) => {
        turboWarpBridge.events.push(event)
    })
})
