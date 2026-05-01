import fs from 'fs';
import path from 'path';

const layouts = ['AdminLayout', 'IMLayout', 'SupplierLayout', 'TransporterLayout'];

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (file === 'page.tsx') {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;
      
      for (const layout of layouts) {
        // Regex to replace `<LayoutName title="...">` with `<>`
        const openRegex = new RegExp(`<${layout}[^>]*>`, 'g');
        const closeRegex = new RegExp(`</${layout}>`, 'g');
        
        if (openRegex.test(content)) {
          content = content.replace(openRegex, '<>');
          content = content.replace(closeRegex, '</>');
          
          // Also remove the import statement for the layout
          const importRegex = new RegExp(`import\\s+${layout}\\s+from\\s+['"][^'"]+['"];?\\n?`, 'g');
          content = content.replace(importRegex, '');
          
          modified = true;
        }
      }
      
      if (modified) {
        fs.writeFileSync(fullPath, content);
        console.log(`Fixed layout wrapper in ${fullPath}`);
      }
    }
  }
}

processDir('/Users/agrataamatya/Desktop/Collaborative-Development/collaborative-development/app/(dashboard)');
