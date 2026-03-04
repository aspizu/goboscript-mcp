import type VM from "scratch-vm"
import type {EditorPreload} from "./types/editor-preload"
export type {ClientToServerEvents, ServerToClientEvents} from "../tw-bridge/socket"

declare global {
    const vm: VM
    const EditorPreload: EditorPreload
}
