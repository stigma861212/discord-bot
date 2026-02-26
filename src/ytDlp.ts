import fs from "fs";
import path from "path";
import YTDlpWrap from "yt-dlp-wrap";

let ytDlpPathPromise: Promise<string> | null = null;

function getBinaryPath() {
  const baseDir = (process as { pkg?: unknown }).pkg
    ? path.dirname(process.execPath)
    : process.cwd();
  const cacheDir = path.join(baseDir, ".cache", "yt-dlp");
  const binName = process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp";
  return {
    cacheDir,
    binPath: path.join(cacheDir, binName),
    platform: process.platform, // win32 | linux | darwin
  };
}

export async function getYtDlpPath(): Promise<string> {
  if (ytDlpPathPromise) return ytDlpPathPromise;

  ytDlpPathPromise = (async () => {
    const { cacheDir, binPath, platform } = getBinaryPath();

    if (fs.existsSync(binPath)) return binPath;

    await fs.promises.mkdir(cacheDir, { recursive: true });

    // Download yt-dlp standalone binary from GitHub releases.
    // On Windows this downloads yt-dlp.exe (no Python required).
    // IMPORTANT: yt-dlp-wrap expects a release tag (e.g. "2025.12.01") or `undefined` to auto-pick latest.
    await YTDlpWrap.downloadFromGithub(binPath, undefined as any, platform);

    return binPath;
  })();

  return ytDlpPathPromise;
}

