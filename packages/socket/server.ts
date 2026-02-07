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
                if (turboWarpBridge.projectPath === null) {
                    return new Response("No project loaded", {status: 404})
                }
                let buf: ArrayBuffer
                try {
                    buf = await Bun.file(turboWarpBridge.projectPath).arrayBuffer()
                } catch (error) {
                    return new Response("Failed to read project file", {status: 500})
                }
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
