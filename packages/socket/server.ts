import {engine, turboWarpBridge} from "./socket"

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
        async fetch(request, server) {
            const url = new URL(request.url)
            if (url.pathname.startsWith("/socket.io")) {
                return engine.handleRequest(request, server)
            }
            if (url.pathname.startsWith("/project.sb3")) {
                const buf = await Bun.file(turboWarpBridge.projectPath).arrayBuffer()
                return new Response(buf, {
                    headers: {
                        "Content-Type": "application/octet-stream",
                    },
                })
            }
        },
    })
    return server
}
