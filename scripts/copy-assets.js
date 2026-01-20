const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const pkgDir = path.join(rootDir, "pkg");

const copyTargets = [
    {
        src: path.join(rootDir, "dist"),
        dest: path.join(pkgDir, "dist"),
    },
    {
        src: path.join(rootDir, "text"),
        dest: path.join(pkgDir, "text"),
    },
    {
        src: path.join(rootDir, ".env"),
        dest: path.join(pkgDir, ".env"),
    },
    {
        src: path.join(rootDir, "node_modules", "sharp", "build", "Release"),
        dest: path.join(pkgDir, "sharp", "build", "Release"),
    },
    {
        src: path.join(rootDir, "node_modules", "sharp", "vendor", "lib"),
        dest: path.join(pkgDir, "sharp", "vendor", "lib"),
    },
];

const copyIfExists = (src, dest) => {
    if (!fs.existsSync(src)) {
        return;
    }
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.cpSync(src, dest, { recursive: true });
};

if (!fs.existsSync(pkgDir)) {
    fs.mkdirSync(pkgDir, { recursive: true });
}

for (const target of copyTargets) {
    copyIfExists(target.src, target.dest);
}
