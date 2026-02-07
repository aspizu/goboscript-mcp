import type {WebSocketData} from "@socket.io/bun-engine"
import {engine} from "./socket"

export interface SocketServerOptions {
    host?: string
    port?: number
}

/** Start the Socket.IO server and return the Bun server instance. */
export function startSocketServer(options: SocketServerOptions = {}) {
    const host = options.host ?? "127.0.0.1"
    const port = options.port ?? 3000

    const {websocket} = engine.handler()

    const server = Bun.serve({
        hostname: host,
        port,
        idleTimeout: 30,

        async fetch(req: Request, server: Bun.Server<WebSocketData>) {
            const url = new URL(req.url)

            if (url.pathname.startsWith("/socket.io/")) {
                return engine.handleRequest(req, server)
            }

            if (url.pathname === "/" || url.pathname === "/test-client.html") {
                return new Response(
                    Bun.file(new URL("test-client.html", import.meta.url).pathname),
                    {headers: {"Content-Type": "text/html"}},
                )
            }

            return new Response("Not found", {status: 404})
        },

        websocket,
    })

    console.log(`Socket.IO server listening on ws://${host}:${port}`)
    return server
}
