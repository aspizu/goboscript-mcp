import {err, type Result} from "neverthrow"
import type {Socket} from "socket.io"
import {intoResult} from "./jsonresult"
import type {
    BlockExecutedEvent,
    ClientToServerEvents,
    ServerToClientEvents,
} from "./socket"

export type HostSocket = Socket<ClientToServerEvents, ServerToClientEvents>

const DISCONNECTED_ERROR = err(new Error("no turbowarp bridge host is connected"))

export class Host {
    private socket?: HostSocket
    events: (BlockExecutedEvent | null)[]

    constructor() {
        this.events = []
    }

    connect(socket: HostSocket): void {
        if (this.socket) {
            this.disconnect()
        }
        this.socket = socket
        console.log("-*- connected -*-")
        socket.on("disconnect", () => {
            console.log("-*- disconnected -*-")
            this.disconnect()
            if (this.events[this.events.length - 1] !== null) {
                this.events.push(null)
            }
        })
        socket.on("blockExecuted", (event) => {
            console.log("-*- event -*-")
            this.events.push(event)
        })
        socket.on("terminated", () => {
            console.log("-*- terminated -*-")
            if (this.events[this.events.length - 1] !== null) {
                this.events.push(null)
            }
        })
    }

    disconnect(): void {
        this.socket?.disconnect()
        this.socket = undefined
    }

    async loadSB3(path: string): Promise<Result<void, Error>> {
        if (!this.socket) return DISCONNECTED_ERROR
        return intoResult(await this.socket.emitWithAck("loadSB3", path))
    }

    async start(): Promise<Result<void, Error>> {
        if (!this.socket) return DISCONNECTED_ERROR
        this.events.length = 0
        return intoResult(await this.socket.emitWithAck("start"))
    }

    async stop(): Promise<Result<void, Error>> {
        if (!this.socket) return DISCONNECTED_ERROR
        if (this.events[this.events.length - 1] !== null) {
            this.events.push(null)
        }
        return intoResult(await this.socket.emitWithAck("stop"))
    }

    async get(selector: string): Promise<Result<string, Error>> {
        if (!this.socket) return DISCONNECTED_ERROR
        return intoResult(await this.socket.emitWithAck("get", selector))
    }
}

export const host = new Host()
