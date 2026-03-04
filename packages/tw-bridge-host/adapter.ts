import JSON5 from "json5"
import {err, ok, type Result} from "neverthrow"
import type {RenderedTarget} from "scratch-vm"
import type {LogLevel} from "../tw-bridge/socket"
import {parse} from "./parser"
import {getSB3, socket} from "./socket"
import {$project} from "./Toolbar"

export async function loadSB3(path: string): Promise<Result<void, Error>> {
    try {
        $project.value = {path, size: 0, loading: true}
        const res = await getSB3(path)
        if (res.isErr()) return err(res.error)
        await vm.loadProject(res.value)
        $project.value = {path, size: res.value.byteLength, loading: false}
        return ok()
    } catch (error) {
        return err(new Error(`Failed to load SB3: ${(error as Error).message}`))
    }
}

export async function start(): Promise<Result<void, Error>> {
    try {
        vm.greenFlag()
        return ok()
    } catch (error) {
        return err(new Error(`Failed to start project: ${(error as Error).message}`))
    }
}

export async function stop(): Promise<Result<void, Error>> {
    try {
        vm.stopAll()
        return ok()
    } catch (error) {
        return err(new Error(`Failed to start project: ${(error as Error).message}`))
    }
}

export async function get(selector: string): Promise<Result<string, Error>> {
    try {
        const parsed = parse(selector)
        if (parsed?.object) {
            const sprite = getSprite(parsed.object)
            if (!sprite) {
                return err(new Error("Sprite not found"))
            }
            if (parsed.variable) {
                let value = getVariable(
                    sprite,
                    parsed.variable + (parsed.property ? "." + parsed.property : ""),
                )
                if (parsed.index && Array.isArray(value)) {
                    value = value[parsed.index]
                }
                if (parsed.length && Array.isArray(value)) {
                    value = value.length
                }
                return ok(JSON5.stringify(value))
            }
        }
        return err(new Error("Invalid selector"))
    } catch (error) {
        return err(new Error(`Failed to get: ${(error as Error).message}`))
    }
}

function getSprite(spriteName: string): RenderedTarget | undefined {
    if (spriteName == "stage") spriteName = "Stage"
    for (const target of vm.runtime.targets) {
        if (target.sprite.name == spriteName) {
            return target
        }
    }
}

function getVariable(target: RenderedTarget, name: string) {
    if (name == "x_position()") return target.x
    if (name == "y_position()") return target.y
    if (name == "direction()") return target.direction
    if (name == "size()") return target.size
    if (name == "volume()") return target.volume
    if (name == "costume_number()") return 1 + target.currentCostume
    if (name == "costume_name()") return target.getCurrentCostume().name
    if (name == "answer()") return vm.runtime._primitives["sensing_answer"]()
    if (name == "username()") return vm.runtime.ioDevices.userData.getUsername()
    vm.getVariableValue(target.id, name)
}

function attachBlockIntercept(opcode: string, callback: (...args: any[]) => void) {
    const block = vm.runtime.getAddonBlock(opcode)
    if (!block) {
        throw new Error(`[tw-bridge-host]: block with opcode ${opcode} not found.`)
    }
    const originalCallback = block.callback
    block.callback = (...args) => {
        callback(...args)
        return originalCallback(...args)
    }
}

const createBlockIntercept =
    (level: LogLevel) =>
    ({content}: any, runtime: any) => {
        const sprite = runtime.thread.target.sprite.name
        socket.emit("blockExecuted", {
            sprite: sprite === "Stage" ? "stage" : sprite,
            level,
            value: JSON5.stringify(content),
            time: new Date().toISOString(),
        })
    }

let attached = false
vm.runtime.on("PROJECT_LOADED", () => {
    if (attached) return
    attached = true
    attachBlockIntercept("\u200B\u200Blog\u200B\u200B %s", createBlockIntercept("log"))
    attachBlockIntercept(
        "\u200B\u200Bwarn\u200B\u200B %s",
        createBlockIntercept("warn"),
    )
    attachBlockIntercept(
        "\u200B\u200Berror\u200B\u200B %s",
        createBlockIntercept("error"),
    )
})

function onStop() {
    socket.emit("terminated")
}

vm.on("PROJECT_RUN_STOP", onStop)
