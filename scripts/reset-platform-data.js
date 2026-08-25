#!/usr/bin/env node
/**
 * Vacía los datos de prueba de la plataforma y deja la base operativa.
 *
 *   node scripts/reset-platform-data.js            → sólo informa, no toca nada
 *   node scripts/reset-platform-data.js --confirm  → aplica los cambios
 *
 * Conserva:
 *   · users con rol admin (info@ingeniowebs.com)
 *   · blogDrafts, salvo que se pase --incluir-blog
 *   · liveChatBotMode y cualquier otra clave de configuración
 *
 * Antes de escribir guarda una copia en data/platform/backups/.
 */

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(process.cwd(), "data", "platform");
const DB_PATH = path.join(DATA_DIR, "db.json");
const BACKUP_DIR = path.join(DATA_DIR, "backups");

const aplicar = process.argv.includes("--confirm");
const incluirBlog = process.argv.includes("--incluir-blog");

/** Colecciones que se vacían: son todas datos generados por uso. */
const A_VACIAR = [
  "projects",
  "leads",
  "messages",
  "liveChats",
  "newsletterSubscribers",
  "newsletterClicks",
  "quotes",
  "notificationStates",
];

if (incluirBlog) A_VACIAR.push("blogDrafts");

if (!fs.existsSync(DB_PATH)) {
  console.error(`No encuentro ${DB_PATH}`);
  console.error("Ejecutá el script desde la raíz del proyecto.");
  process.exit(1);
}

const db = JSON.parse(fs.readFileSync(DB_PATH, "utf8"));

const usuarios = Array.isArray(db.users) ? db.users : [];
const admins = usuarios.filter((u) => u.role === "admin");
const noAdmins = usuarios.filter((u) => u.role !== "admin");

console.log("\n  Estado actual\n  " + "-".repeat(46));
for (const clave of A_VACIAR) {
  const n = Array.isArray(db[clave]) ? db[clave].length : 0;
  console.log(`  ${clave.padEnd(24)} ${String(n).padStart(4)}  ->  0`);
}
console.log(`  ${"users".padEnd(24)} ${String(usuarios.length).padStart(4)}  ->  ${admins.length}`);

if (!incluirBlog) {
  const n = Array.isArray(db.blogDrafts) ? db.blogDrafts.length : 0;
  console.log(`  ${"blogDrafts".padEnd(24)} ${String(n).padStart(4)}  ->  ${n}  (sin tocar)`);
}

if (admins.length === 0) {
  console.error("\n  ABORTADO: no hay ningún usuario admin.");
  console.error("  Vaciar la base te dejaría sin acceso a la plataforma.\n");
  process.exit(1);
}

console.log("\n  Se conservan estos usuarios:");
for (const a of admins) console.log(`    · ${a.email} (${a.role})`);
if (noAdmins.length) {
  console.log("\n  Se eliminan estos usuarios:");
  for (const u of noAdmins) console.log(`    · ${u.email} (${u.role})`);
}

if (!aplicar) {
  console.log("\n  Esto fue sólo una previsualización: no se modificó nada.");
  console.log("  Para aplicarlo:  node scripts/reset-platform-data.js --confirm\n");
  process.exit(0);
}

fs.mkdirSync(BACKUP_DIR, { recursive: true });
const sello = new Date().toISOString().replace(/[:.]/g, "-");
const backup = path.join(BACKUP_DIR, `db-${sello}.json`);
fs.copyFileSync(DB_PATH, backup);

for (const clave of A_VACIAR) db[clave] = [];
db.users = admins;

/* Escritura atómica: mismo patrón que usa store.ts, para que la app no
   pueda leer un archivo a medio escribir si justo consulta en ese momento. */
const tmp = `${DB_PATH}.reset.${process.pid}.tmp`;
fs.writeFileSync(tmp, JSON.stringify(db, null, 2), "utf8");
fs.renameSync(tmp, DB_PATH);

console.log(`\n  Copia de seguridad: ${backup}`);
console.log("  Base restablecida.\n");
console.log("  Reiniciá la app para que tome los cambios:");
console.log("    pm2 restart ingeniowebs\n");
