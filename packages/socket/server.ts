import {engine} from "./socket"

export interface SocketServerOptions {
    host?: string
    port?: number
}

export function startSocketServer(options: SocketServerOptions = {}) {
    const host = options.host ?? "127.0.0.1"
    const port = options.port ?? 3000

    const server = Bun.serve({
        hostname: host,
        port,
        ...engine.handler(),
        idleTimeout: 30,
    })
    return server
}
