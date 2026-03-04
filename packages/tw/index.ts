import {server} from "@goboscript/tw-bridge"
import {program} from "commander"
import * as datefns from "date-fns"
import type {Result} from "neverthrow"
import Path from "path"
import * as client from "./client"

function finish<T>(res: Result<T, Error>): never {
    if (res.isErr()) {
        console.error(res.error.message)
    }
    process.exit(res.isOk() ? 0 : 1)
}

program.name("tw")

program.command("bridge").action(async () => server.serve())

program.command("load [project]").action(async (project) => {
    if (!project) project = Path.basename(process.cwd()) + ".sb3"
    return finish(await client.loadSB3(Path.resolve(process.cwd(), project)))
})

program
    .command("start")
    .option("-l, --listen", "listen for block events")
    .action(async () => {
        const res1 = await client.start()
        if (res1.isErr()) {
            console.error(res1.error.message)
            process.exit(1)
        }
        if (process.argv.includes("--listen") || process.argv.includes("-l")) {
            const cleanup = client.onEvents((event) => {
                if (event === null) {
                    process.exit(0)
                }
                const time = new Date(event.time)
                console.log(
                    `[${event.level.toUpperCase()} ${datefns.format(time, "hh:mm:ss")} ${event.sprite}]: ${event.value}`,
                )
            })
            process.on("SIGINT", () => {
                cleanup()
                process.exit(0)
            })
        }
    })

program.command("stop").action(async () => finish(await client.stop()))

program.command("get <selector>").action(async (selector) => {
    const res = await client.get(selector)
    if (res.isOk()) {
        console.log(res.value)
    }
    finish(res)
})

await program.parseAsync()
