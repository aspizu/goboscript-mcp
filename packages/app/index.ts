import {startMCPServer} from "@goboscript/mcp"
import {startSocketServer} from "@goboscript/socket"
import {program} from "commander"

program
    .name("goboscript")
    .description("goboscript MCP + Socket.IO server")
    .version("1.0.0")

program
    .command("start")
    .description("Start both the MCP (stdio) and Socket.IO servers")
    .option("-H, --host <host>", "Socket.IO server host", "127.0.0.1")
    .option("-p, --port <port>", "Socket.IO server port", "3000")
    .action(async (options) => {
        await startMCPServer()
        startSocketServer({host: options.host, port: Number(options.port)})
    })

program.parse()
