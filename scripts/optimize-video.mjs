import ffmpegStatic from "ffmpeg-static";
import { path as ffprobePath } from "ffprobe-static";
import Ffmpeg from "fluent-ffmpeg";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const input = path.join(__dirname, "../public/hero.mp4");
const outputMp4 = path.join(__dirname, "../public/hero-opt.mp4");
const outputWebm = path.join(__dirname, "../public/hero.webm");

Ffmpeg.setFfmpegPath(ffmpegStatic);

// MP4 optimizado — H.264, compatible con todos los dispositivos
function optimizeMp4() {
  return new Promise((resolve, reject) => {
    console.log("⚙️  Generando MP4 optimizado...");
    Ffmpeg(input)
      .videoCodec("libx264")
      .outputOptions([
        "-crf 28",           // calidad (18=alta, 28=equilibrado, 35=menor peso)
        "-preset slow",      // mejor compresión
        "-movflags faststart", // carga rápida en web (metadata al principio)
        "-vf scale=1920:-2", // max 1920px ancho
        "-an",               // sin audio
        "-pix_fmt yuv420p",  // compatibilidad máxima (iOS, Safari)
      ])
      .save(outputMp4)
      .on("progress", (p) => process.stdout.write(`\r   MP4: ${Math.round(p.percent ?? 0)}%`))
      .on("end", () => { console.log("\n✅ MP4 listo"); resolve(); })
      .on("error", reject);
  });
}

// WebM optimizado — VP9, mejor compresión en Chrome/Firefox
function optimizeWebm() {
  return new Promise((resolve, reject) => {
    console.log("⚙️  Generando WebM (VP9)...");
    Ffmpeg(input)
      .videoCodec("libvpx-vp9")
      .outputOptions([
        "-crf 35",
        "-b:v 0",
        "-vf scale=1920:-2",
        "-an",
        "-deadline good",
        "-cpu-used 2",
      ])
      .save(outputWebm)
      .on("progress", (p) => process.stdout.write(`\r   WebM: ${Math.round(p.percent ?? 0)}%`))
      .on("end", () => { console.log("\n✅ WebM listo"); resolve(); })
      .on("error", reject);
  });
}

console.log("🎬 Optimizando hero video...\n");
await optimizeMp4();
await optimizeWebm();
console.log("\n🚀 Optimización completada. Archivos en /public:");
console.log("   hero-opt.mp4 (H.264 — Safari, iOS, universal)");
console.log("   hero.webm    (VP9  — Chrome, Firefox, mejor compresión)");
