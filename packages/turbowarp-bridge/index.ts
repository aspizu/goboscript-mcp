import {io, Socket} from "socket.io-client"
// Import types from the socket server package
import type * as SocketTypes from "../socket/socket"

export function connectToServer(
    url: string,
): Socket<SocketTypes.ServerToClientEvents, SocketTypes.ClientToServerEvents> {
    return io(url)
}
