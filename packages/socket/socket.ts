import {Server as Engine} from "@socket.io/bun-engine"
import {Server, Socket} from "socket.io"

/** Severity level for project log messages. */
export type LogLevel = "log" | "warn" | "error"

/** A block execution event emitted by the running project. */
export interface BlockExecutedEvent {
    sprite: string
    level: LogLevel
    value: string
    type: string
}

export type Result<T> = {ok: true; value: T} | {ok: false; error: string}

/** Events sent from the server to connected clients. */
export interface ServerToClientEvents {
    /** Load a project from an absolute .sb3 path. Ack resolves on success. */
    loadProject: (path: string, ack: (result: Result<void>) => void) => void
    /** Start the currently loaded project. Ack resolves on success. */
    startProject: (ack: (result: Result<void>) => void) => void
    /** Stop the currently running project. Ack resolves on success. */
    stopProject: (ack: (result: Result<void>) => void) => void
    /** Set a variable in the running project. Ack resolves on success. */
    setVariable: (
        sprite: string,
        name: string,
        value: string,
        ack: (result: Result<void>) => void,
    ) => void
    getVariable: (
        sprite: string,
        name: string,
        ack: (result: Result<string>) => void,
    ) => void
}

/** Events sent from a client to the server. */
export interface ClientToServerEvents {
    /** A block was executed in the running project. */
    blockExecuted: (event: BlockExecutedEvent) => void
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
