import {signal} from "@preact/signals"
import {loadSB3} from "./adapter"

export const $connected = signal(false)
export const $project = signal<{path: string; size: number; loading: boolean} | null>(
    null,
)

async function onReloadFromDisk() {
    if (!$project.value) return
    const res = await loadSB3($project.value.path)
    if (res.isErr()) {
        console.error(res.error.message)
    }
}

export default function Toolbar() {
    const project = $project.value
    const connected = $connected.value

    return (
        <div class="inline-flex items-stretch h-7 font-mono text-[11px] tracking-wide bg-[#0e0e0f] border border-[#1f1f22] rounded-sm overflow-hidden select-none">
            {/* Status */}
            <div
                class={[
                    "flex items-center gap-1.5 px-2.5 border-r border-[#1f1f22]",
                    connected ? "text-[#6b8f63]" : "text-[#5c3535]",
                ].join(" ")}
            >
                <span
                    class={[
                        "block w-1.5 h-1.5 rounded-full shrink-0",
                        connected ? "bg-[#5a9e6f]" : "bg-[#8b3a3a]",
                    ].join(" ")}
                />
                {connected ? "CONNECTED" : "DISCONNECTED"}
            </div>

            {/* Path + size */}
            {project &&
                (project.loading ?
                    <div class="flex items-center gap-2 px-2.5 border-r border-[#1f1f22] text-[#4a4a52]">
                        <LoadingDots />
                        <span>LOADING</span>
                    </div>
                :   <>
                        <div
                            class="flex items-center px-2.5 border-r border-[#1f1f22] text-[#c8a96e] max-w-70 overflow-hidden text-ellipsis whitespace-nowrap"
                            title={project.path}
                        >
                            {project.path.replace(/^\/home\/[^/]+/, "~")}
                        </div>
                        <div class="flex items-center px-2.5 border-r border-[#1f1f22] text-[#4a4a5a] whitespace-nowrap shrink-0">
                            {(project.size / 1024).toFixed(2)}
                            <span class="text-[#2d2d36] ml-0.5">KiB</span>
                        </div>
                    </>)}

            {/* Reload */}
            {project && (
                <button
                    class="flex items-center gap-1.5 px-2.5 text-[#4a4a5e] transition-colors duration-100 hover:text-[#7a7a9a] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-[#4a4a5e]"
                    disabled={project.loading}
                    onClick={onReloadFromDisk}
                >
                    <ReloadIcon loading={project.loading} />
                    RELOAD
                </button>
            )}
        </div>
    )
}

function ReloadIcon({loading}: {loading: boolean}) {
    return (
        <svg
            class={loading ? "animate-spin" : ""}
            width="11"
            height="11"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{flexShrink: 0}}
        >
            <path
                d="M10 6A4 4 0 1 1 6 2"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                fill="none"
            />
            <path d="M6 2L8 0.5V3.5L6 2Z" fill="currentColor" />
        </svg>
    )
}

function LoadingDots() {
    return (
        <div class="flex gap-0.75 items-center">
            <span class="block w-0.75 h-0.75 rounded-full bg-[#4a4a5a] animate-[blink_1.2s_ease-in-out_0s_infinite]" />
            <span class="block w-0.75 h-0.75 rounded-full bg-[#4a4a5a] animate-[blink_1.2s_ease-in-out_0.2s_infinite]" />
            <span class="block w-0.75 h-0.75 rounded-full bg-[#4a4a5a] animate-[blink_1.2s_ease-in-out_0.4s_infinite]" />
        </div>
    )
}
