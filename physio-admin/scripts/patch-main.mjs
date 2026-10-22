// Usage: node scripts/patch-main.mjs src/main.jsx
// Safe to run once; creates src/main.jsx.bak first.
import fs from "node:fs";

const file = process.argv[2] || "src/main.jsx";
let s = fs.readFileSync(file, "utf8");

if (s.includes("useDoctors(")) { console.log("Already patched."); process.exit(0); }
fs.writeFileSync(file + ".bak", s);

const steps = [
  ["imports", /import '\.\/styles\.css';/, "import './styles.css';\nimport AdminPanel from './admin/AdminPanel';\nimport { useDoctors } from './hooks/useDoctors';"],
  ["fallback list", /const doctors = \[/, "const fallbackDoctors = ["],
  ["App hook", /function App\(\)\s*\{/, "function App(){\n const { doctors } = useDoctors(fallbackDoctors);"],
  ["memo deps", /\}\),\[query,condition\]\);/, "}),[query,condition,doctors]);"],
  ["render", /createRoot\(document\.getElementById\('root'\)\)\.render\(<App\/>\);/, "const isAdminRoute = window.location.pathname.startsWith('/admin');\ncreateRoot(document.getElementById('root')).render(isAdminRoute ? <AdminPanel/> : <App/>);"],
];

for (const [name, re, rep] of steps) {
  if (!re.test(s)) { console.error(`Could not find: ${name}. No changes written.`); process.exit(1); }
  s = s.replace(re, rep);
}
fs.writeFileSync(file, s);
console.log("Patched " + file + " (backup at " + file + ".bak)");
