#!/usr/bin/env bash
set -e

bun i

cd packages/tw-bridge-host && bun run build && cd ../..

# Resolve TurboWarp config directory
if [ -d /mnt/c ]; then
    TW_DIR="/mnt/c/Users/$USER/AppData/Roaming/turbowarp-desktop"
elif [[ "$OSTYPE" == darwin* ]]; then
    TW_DIR="$HOME/Library/Containers/org.turbowarp.desktop/Data/Library/Application Support/turbowarp-desktop"
    [ -d "$TW_DIR" ] || TW_DIR="$HOME/Library/Application Support/turbowarp-desktop"
elif [[ "$OSTYPE" == linux* ]]; then
    TW_DIR="$HOME/.var/app/org.turbowarp.TurboWarp/config/turbowarp-desktop"
    [ -d "$TW_DIR" ] || TW_DIR="$HOME/snap/turbowarp-desktop/current/.config/turbowarp-desktop"
    [ -d "$TW_DIR" ] || TW_DIR="$HOME/.config/turbowarp-desktop"
else
    echo "Unsupported platform: $OSTYPE" && exit 1
fi

cp packages/tw-bridge-host/dist/index.js "$TW_DIR/userscript.js"
cp packages/tw-bridge-host/dist/index.css "$TW_DIR/userstyle.css"

# Add shell alias
ALIAS_LINE="alias tw='bun --bun $(pwd)/packages/tw/index.ts'"
if grep -qF "$ALIAS_LINE" ~/.bashrc; then
    echo "'tw' alias already present in ~/.bashrc, skipping."
else
    echo "$ALIAS_LINE" >> ~/.bashrc
    echo "Added 'tw' alias to ~/.bashrc — run 'source ~/.bashrc' to activate."
fi
