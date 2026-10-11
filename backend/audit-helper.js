const fs = require('fs');
const path = require('path');

// 1. Audit SQL in all controllers
const dir = path.join(__dirname, 'controllers');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
let issues = [];
let queryCount = 0;

for (const f of files) {
  const content = fs.readFileSync(path.join(dir, f), 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('db.execute') || line.includes('db.query')) {
      queryCount++;
      if (line.includes('${')) {
        issues.push({ file: f, line: idx + 1, code: line.trim() });
      }
    }
  });
}

console.log('=== SQL AUDIT ===');
console.log('Total DB Queries detected:', queryCount);
console.log('Queries with template string interpolation:', issues.length);
if (issues.length > 0) {
  console.log('Issues:', JSON.stringify(issues, null, 2));
}

// 2. Count routes across all route files
const routesDir = path.join(__dirname, 'routes');
const routeFiles = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));
let totalRoutes = 0;
let routeList = [];

for (const rf of routeFiles) {
  const content = fs.readFileSync(path.join(routesDir, rf), 'utf8');
  const matches = content.matchAll(/router\.(get|post|put|delete|patch)\(\s*['"]([^'"]+)['"]/g);
  for (const m of matches) {
    totalRoutes++;
    routeList.push({ file: rf, method: m[1].toUpperCase(), path: m[2] });
  }
}

console.log('\n=== ROUTE AUDIT ===');
console.log('Total Route Files:', routeFiles.length);
console.log('Total Individual Route Handlers:', totalRoutes);
console.log('Sample routes:', routeList.slice(0, 10));
