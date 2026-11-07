// Il sito è statico: la "build" copia solo i file pubblici nella cartella dist,
// lasciando fuori README, script SQL e file di sviluppo.
// Serve a Cloudflare Pages, che esegue `npm run build` e pubblica dist (o la radice).
import { cpSync, mkdirSync, readdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";

const radice = process.cwd();
const dist = join(radice, "dist");
const cartelle = ["css", "js", "contenuti"];

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist);

const pagine = readdirSync(radice).filter((f) => f.endsWith(".html"));
for (const f of pagine) cpSync(join(radice, f), join(dist, f));
for (const c of cartelle) {
  if (existsSync(join(radice, c))) cpSync(join(radice, c), join(dist, c), { recursive: true });
}

console.log(`Sito pronto in dist/: ${pagine.length} pagine e le cartelle ${cartelle.join(", ")}.`);
