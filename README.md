# goboscript MCP server

## Installation

Clone the repository to some directory, keep this path in mind for later

```bash
bun i
```

Compile the turbowarp bridge:

```bash
cd packages/turbowarp-bridge
bun run build
```

Copy the `dist/userscript.js` to your turbowarp installation directory

Add to `opencode.jsonc`

Make sure to replace `<path-to-goboscript-mcp>` with the actual path to the cloned repository

```jsonc
{
    "$schema": "https://opencode.ai/config.json",
    "mcp": {
        "goboscript-mcp": {
            "type": "local",
            "command": [
                "bash",
                "-c",
                "cd <path-to-goboscript-mcp>/packages/app && bun run index.ts start",
            ],
            "enabled": true,
        },
    },
}
```

## Usage

Run opencode and open turbowarp, open the devtools by pressing `ctrl + shift + i` and navigate to the console, you should see a message like this:

```
[turbowarp-bridge] Connected to MCP server
```

Now you can ask the agent to run and debug goboscript projects
