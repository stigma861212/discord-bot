const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const pkgDir = path.join(rootDir, "discord-bot");
const nodeModulesSrc = path.join(rootDir, "node_modules");
const nodeModulesDest = path.join(pkgDir, "node_modules");

const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf8"));
const devDeps = new Set(Object.keys(pkg.devDependencies || {}));

// 排除的檔案/資料夾，縮小體積（排除 .bin 可省約 5-10MB）
const EXCLUDE = /(?:^|\/)(?:\.bin|__tests__|test|tests|docs?|examples?|\.github|\.vscode|\.md$|\.ts$|\.d\.ts$|\.map$|\.flow$|\.yml$|\.yaml$|Makefile|LICENSE|LICENCE|CHANGELOG|HISTORY|binding\.gyp|package-lock\.json|yarn\.lock)$/;

function copyNodeModules(src, dest, isRoot = true) {
    if (!fs.existsSync(src)) return;
    fs.mkdirSync(dest, { recursive: true });
    for (const name of fs.readdirSync(src)) {
        if (isRoot && name.startsWith("@")) {
            for (const sub of fs.readdirSync(path.join(src, name))) {
                const pkgName = name + "/" + sub;
                if (devDeps.has(pkgName)) continue;
                copyNodeModules(path.join(src, name, sub), path.join(dest, name, sub), false);
            }
            continue;
        }
        if (isRoot && devDeps.has(name)) continue;
        const srcPath = path.join(src, name);
        const destPath = path.join(dest, name);
        const relPath = path.relative(nodeModulesSrc, srcPath).replace(/\\/g, "/");
        if (EXCLUDE.test("/" + relPath)) continue;
        const stat = fs.statSync(srcPath);
        if (stat.isDirectory()) {
            copyNodeModules(srcPath, destPath, false);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

const copyTargets = [
    { src: path.join(rootDir, "dist"), dest: path.join(pkgDir, "dist") },
    { src: path.join(rootDir, "text"), dest: path.join(pkgDir, "text") },
    { src: path.join(rootDir, ".env"), dest: path.join(pkgDir, ".env") },
    { src: path.join(rootDir, "node_modules", "sharp", "build", "Release"), dest: path.join(pkgDir, "sharp", "build", "Release") },
    { src: path.join(rootDir, "node_modules", "sharp", "vendor", "lib"), dest: path.join(pkgDir, "sharp", "vendor", "lib") },
];

const copyIfExists = (src, dest) => {
    if (!fs.existsSync(src)) return;
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.cpSync(src, dest, { recursive: true });
};

fs.mkdirSync(pkgDir, { recursive: true });
for (const { src, dest } of copyTargets) {
    copyIfExists(src, dest);
}
copyNodeModules(nodeModulesSrc, nodeModulesDest);
