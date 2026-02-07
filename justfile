install-bridge:
    cd packages/turbowarp-bridge && bun run build && cp dist/index.js /mnt/c/Users/$USER/AppData/Roaming/turbowarp-desktop/userscript.js
