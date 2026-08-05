/**
 * set-admin-claim.mjs — Script de un solo uso para asignar el rol admin
 *
 * Uso:
 *   1. Pon la serviceAccountKey.json en la raíz del proyecto.
 *   2. Reemplaza TU_UID_AQUI con tu UID de Firebase Auth.
 *   3. Ejecuta: node scripts/set-admin-claim.mjs
 *   4. Cierra sesión y vuelve a entrar en el blog para que el nuevo token surta efecto.
 *   5. Borra este script o déjalo (el UID ya está hardcodeado, no es un riesgo).
 *
 * Tu UID lo encuentras en:
 *   Firebase Console → Build → Authentication → Users → columna "UID de usuario"
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getAuth }             from "firebase-admin/auth";
import { createRequire }       from "module";

const require = createRequire(import.meta.url);
const serviceAccount = require("../serviceAccountKey.json");

// ──────────────────────────────────────────────
// ⚠️  REEMPLAZA ESTO CON TU UID REAL DE FIREBASE
const TARGET_UID = "7DY1UnJ2fvY2Mvv6ma6JK6O6EH43";
// ──────────────────────────────────────────────

initializeApp({ credential: cert(serviceAccount) });

const adminAuth = getAuth();

adminAuth
  .setCustomUserClaims(TARGET_UID, { admin: true })
  .then(() => {
    console.log(`✅ Claim admin asignado exitosamente al UID: ${TARGET_UID}`);
    console.log("   Cierra sesión y vuelve a entrar en el blog para que surta efecto.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Error al asignar el claim:", err.message);
    process.exit(1);
  });
