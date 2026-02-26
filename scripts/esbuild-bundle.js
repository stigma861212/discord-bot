/**
 * esbuild 打包：將 JS 依賴打包成單一檔案，縮小 pkg 體積
 * 需 external：sharp, ffmpeg-static（native 模組）
 */
const esbuild = require("esbuild");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");

esbuild.build({
    entryPoints: [path.join(rootDir, "src", "main.ts")],
    bundle: true,
    platform: "node",
    target: "node18",
    outfile: path.join(rootDir, "dist", "bundle.js"),
    format: "cjs",
    sourcemap: false,
    minify: true,
    external: [
        "sharp",
        "ffmpeg-static",
        "@discordjs/opus",
    ],
}).then(() => {
    console.log("esbuild bundle OK: dist/bundle.js");
}).catch((err) => {
    console.error(err);
    process.exit(1);
});
