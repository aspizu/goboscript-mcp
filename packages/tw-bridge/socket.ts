import {Server as Engine} from "@socket.io/bun-engine"
import {Server} from "socket.io"
import {host} from "./host"
import type {JSONResult} from "./jsonresult"

/** Severity level for project log messages. */
export type LogLevel = "log" | "warn" | "error"

/** A block execution event emitted by the running project. */
export interface BlockExecutedEvent {
    sprite: string
    level: LogLevel
    value: string
    time: string
}

/** Events sent from the server to connected clients. */
export interface ServerToClientEvents {
    loadSB3: (path: string, ack: (result: JSONResult<void, string>) => void) => void
    start: (ack: (result: JSONResult<void, string>) => void) => void
    stop: (ack: (result: JSONResult<void, string>) => void) => void
    get: (selector: string, ack: (result: JSONResult<string, string>) => void) => void
}

/** Events sent from a client to the server. */
export interface ClientToServerEvents {
    /** A block was executed in the running project. */
    blockExecuted: (event: BlockExecutedEvent) => void
    terminated: () => void
}

export const io = new Server<ClientToServerEvents, ServerToClientEvents>({
    cors: {origin: "*"},
})

export const engine = new Engine({path: "/socket.io/"})

io.bind(engine)

io.on("connection", (socket) => host.connect(socket))
