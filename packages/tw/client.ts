import type {BlockExecutedEvent} from "@goboscript/tw-bridge/socket"
import {err, ok, Result} from "neverthrow"

type EventCallback = (event: BlockExecutedEvent | null) => void

let abortController: AbortController | null = null
let eventCallback: EventCallback | null = null

export function onEvents(callback: EventCallback): () => void {
    eventCallback = callback
    if (!abortController) {
        abortController = new AbortController()
        fetch("http://localhost:9060/events", {signal: abortController.signal})
            .then(async (res) => {
                if (!res.body) throw new Error("No body")
                const reader = res.body.getReader()
                const decoder = new TextDecoder()
                let buffer = ""
                while (true) {
                    const {done, value} = await reader.read()
                    if (done) break
                    buffer += decoder.decode(value, {stream: true})
                    const lines = buffer.split("\n")
                    buffer = lines.pop() || ""
                    for (const line of lines) {
                        if (line.startsWith("data: ")) {
                            const data = line.slice(6)
                            if (eventCallback) {
                                const parsed = data === "" ? null : JSON.parse(data)
                                eventCallback(parsed)
                            }
                        }
                    }
                }
            })
            .catch(() => {})
    }
    return () => {
        eventCallback = null
        abortController?.abort()
        abortController = null
    }
}

async function rpc<T>(
    method: string,
    params: Record<string, unknown>,
): Promise<Result<T, Error>> {
    try {
        const res = await fetch("http://localhost:9060/rpc", {
            method: "POST",
            body: JSON.stringify({method, ...params}),
        })
        if (!res.ok) {
            throw new Error(`failed to call ${method}: ${res.statusText}`)
        }
        const data: any = await res.json()
        if (!data.isOk) {
            return err(new Error(data.error))
        }
        return ok(data.value as T)
    } catch (error) {
        return err(error as Error)
    }
}

export function loadSB3(path: string): Promise<Result<void, Error>> {
    return rpc("loadSB3", {path})
}

export function start(): Promise<Result<void, Error>> {
    return rpc("start", {})
}

export function stop(): Promise<Result<void, Error>> {
    return rpc("stop", {})
}

export function get(selector: string): Promise<Result<string, Error>> {
    return rpc("get", {selector})
}

export function events(): Promise<Result<(BlockExecutedEvent | null)[], Error>> {
    return rpc("events", {})
}
