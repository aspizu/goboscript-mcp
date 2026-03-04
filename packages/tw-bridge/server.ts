import {ok} from "neverthrow"
import z from "zod"
import {host} from "./host"
import {fromResult} from "./jsonresult"
import {engine} from "./socket"
import type {BlockExecutedEvent} from "./socket"
import {addSSEClient, removeSSEClient} from "./events"

async function openSB3(path: string): Promise<Uint8Array | null> {
    if (!(path.endsWith(".sb3") || path.endsWith(".SB3"))) return null
    const file = Bun.file(path)
    const bytes = await file.bytes()
    if (
        !(
            bytes[0] === 0x50 &&
            bytes[1] === 0x4b &&
            bytes[2] === 0x03 &&
            bytes[3] === 0x04
        )
    ) {
        return null
    }
    return bytes
}

const rpcSchema = z.union([
    z.object({
        method: z.literal("loadSB3"),
        path: z.string(),
    }),
    z.object({
        method: z.literal("start"),
    }),
    z.object({
        method: z.literal("stop"),
    }),
    z.object({
        method: z.literal("get"),
        selector: z.string(),
    }),
    z.object({
        method: z.literal("events"),
    }),
])

export class Server {
    serve() {
        Bun.serve({
            ...engine.handler(),
            fetch: undefined,
            hostname: "localhost",
            port: 9060,
            routes: {
                "/socket.io/": (req, server) => engine.handleRequest(req, server),
                "/get.sb3": (req) => this.getSB3(req),
                "/rpc": (req) => this.rpc(req),
                "/events": (req) => this.events(req),
            },
        })
    }

    async getSB3(req: Request) {
        if (req.method != "GET") {
            return new Response("Method Not Allowed", {
                status: 405,
                headers: {Allow: "GET"},
            })
        }
        const url = new URL(req.url)
        const path = url.searchParams.get("path")
        if (!path) {
            return new Response("Missing required query parameter: path", {status: 400})
        }
        const bytes = await openSB3(path)
        if (!bytes) {
            return new Response("Forbidden", {status: 403})
        }
        return new Response(bytes, {headers: {"Content-Type": "application/zip"}})
    }

    async rpc(req: Request) {
        if (req.method != "POST") {
            return new Response("Method Not Allowed", {
                status: 405,
                headers: {Allow: "POST"},
            })
        }
        const data = await req.json()
        const parsed = rpcSchema.safeParse(data)
        if (!parsed.success) {
            return new Response("Invalid request", {status: 400})
        }
        if (parsed.data.method == "loadSB3") {
            return Response.json(fromResult(await host.loadSB3(parsed.data.path)))
        }
        if (parsed.data.method == "start") {
            return Response.json(fromResult(await host.start()))
        }
        if (parsed.data.method == "stop") {
            return Response.json(fromResult(await host.stop()))
        }
        if (parsed.data.method == "get") {
            return Response.json(fromResult(await host.get(parsed.data.selector)))
        }
        if (parsed.data.method == "events") {
            return Response.json(fromResult(ok(host.events)))
        }
    }

    events(req: Request): Response {
        const stream = new ReadableStream({
            start(controller) {
                const encoder = new TextEncoder()
                const client = {
                    write(event: BlockExecutedEvent | null) {
                        controller.enqueue(
                            encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
                        )
                    },
                    close() {
                        removeSSEClient(this.write)
                    },
                }
                addSSEClient(client.write, client.close)
                req.signal.addEventListener("abort", () => {
                    client.close()
                    controller.close()
                })
            },
        })
        return new Response(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
            },
        })
    }
}

export const server = new Server()
