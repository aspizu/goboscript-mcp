import {err, ok, Result} from "neverthrow"
import {io, type Socket} from "socket.io-client"
import * as adapter from "./adapter"
import {fromResult} from "./jsonresult"
import {$connected} from "./Toolbar"
import type {ClientToServerEvents, ServerToClientEvents} from "./types"

export const SERVER = "http://localhost:9060"

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SERVER, {
    transports: ["websocket"],
    upgrade: false,
})

export async function getSB3(path: string): Promise<Result<ArrayBuffer, Error>> {
    try {
        const res = await fetch(`${SERVER}/get.sb3?path=${encodeURIComponent(path)}`)
        if (!res.ok) {
            const text = await res.text().catch(() => res.statusText)
            return err(new Error(`Failed to get SB3 (${res.status}): ${text}`))
        }
        return ok(await res.arrayBuffer())
    } catch (error) {
        return err(new Error(`Failed to get SB3: ${(error as Error).message}`))
    }
}

socket.on("loadSB3", async (path, ack) => ack(fromResult(await adapter.loadSB3(path))))
socket.on("start", async (ack) => ack(fromResult(await adapter.start())))
socket.on("stop", async (ack) => ack(fromResult(await adapter.stop())))
socket.on("get", async (selector, ack) => ack(fromResult(await adapter.get(selector))))
socket.on("connect", () => ($connected.value = true))
socket.on("disconnect", () => ($connected.value = false))
