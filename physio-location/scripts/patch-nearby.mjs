// Usage: node scripts/patch-nearby.mjs src/main.jsx
// Run after patch-main.mjs. Makes src/main.jsx.bak2 first. Safe to run once.
import fs from "node:fs";

const file = process.argv[2] || "src/main.jsx";
let s = fs.readFileSync(file, "utf8");

if (s.includes("NearbyFinder")) { console.log("Already patched."); process.exit(0); }
fs.writeFileSync(file + ".bak2", s);

const steps = [
  ["imports", /import AdminPanel from '\.\/admin\/AdminPanel';/,
    "import AdminPanel from './admin/AdminPanel';\nimport NearbyFinder, { HeroLocationBox } from './components/NearbyFinder';"],
  ["find-nearby click handler", /e\.stopPropagation\(\);\s*startNearby\(\);/,
    "e.stopPropagation();\n        window.dispatchEvent(new CustomEvent('open-nearby-finder'));"],
  ["hero button", /(<a className="btn btn-primary" href="#find">Find nearby physio <ArrowRight size=\{18\}\/><\/a>)/,
    "$1<HeroLocationBox/>"],
  ["render", /isAdminRoute \? <AdminPanel\/> : <App\/>/,
    "isAdminRoute ? <AdminPanel/> : <><App/><NearbyFinder/></>"],
];

for (const [name, re, rep] of steps) {
  if (!re.test(s)) {
    console.error(`Could not find: ${name}. No changes written. Run scripts/patch-main.mjs first.`);
    process.exit(1);
  }
  s = s.replace(re, rep);
}
fs.writeFileSync(file, s);
console.log("Patched " + file + " (backup at " + file + ".bak2)");
