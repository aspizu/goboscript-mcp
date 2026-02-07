import type VM from "scratch-vm"
import type {EditorPreload} from "./types/editor-preload"

declare global {
    const vm: VM
    const EditorPreload: EditorPreload
}
