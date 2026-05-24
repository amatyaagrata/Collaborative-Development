const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      if (f !== 'node_modules' && f !== '.next' && f !== '.git') {
        walkDir(dirPath, callback);
      }
    } else {
      callback(dirPath);
    }
  });
}

console.log("=== Searching for stock_movements in codebase ===");

walkDir('.', (filePath) => {
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx') || filePath.endsWith('.js') || filePath.endsWith('.sql')) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('stock_movements')) {
      console.log(`\nFound in file: ${filePath}`);
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (line.includes('stock_movements') || line.includes('movement_type')) {
          console.log(`  Line ${index + 1}: ${line.trim()}`);
        }
      });
    }
  }
});
