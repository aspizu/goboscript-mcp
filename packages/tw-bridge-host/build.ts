import tailwindcss from "bun-plugin-tailwind"
await Bun.build({
    entrypoints: ["index.ts"],
    format: "iife",
    target: "browser",
    outdir: "dist",
    minify: true,
    plugins: [tailwindcss],
})
