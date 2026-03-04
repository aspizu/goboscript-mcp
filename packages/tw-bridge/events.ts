import type {BlockExecutedEvent} from "./socket"

const sseClients = new Set<{
    write: (data: BlockExecutedEvent | null) => void
    close: () => void
}>()

export function addSSEClient(
    write: (data: BlockExecutedEvent | null) => void,
    close: () => void,
): void {
    sseClients.add({write, close})
}

export function removeSSEClient(
    write: (data: BlockExecutedEvent | null) => void,
): void {
    for (const client of sseClients) {
        if (client.write === write) {
            sseClients.delete(client)
            break
        }
    }
}

export function broadcastEvent(event: BlockExecutedEvent | null): void {
    for (const client of sseClients) {
        client.write(event)
    }
}
