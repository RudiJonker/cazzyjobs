const fs = require('fs');
const path = require('path');

function generateTree(dir, prefix = '', depth = Infinity) {
  if (depth < 0) return '';
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const folders = entries.filter(e => e.isDirectory());
  const files = entries.filter(e => e.isFile());

  let tree = '';

  folders.forEach((folder, i) => {
    const isLast = i === folders.length - 1 && files.length === 0;
    const connector = isLast ? '└── ' : '├── ';
    tree += `${prefix}${connector}${folder.name}/\n`;
    const newPrefix = prefix + (isLast ? '    ' : '│   ');
    tree += generateTree(path.join(dir, folder.name), newPrefix, depth - 1);
  });

  files.forEach((file, i) => {
    const isLast = i === files.length - 1;
    const connector = isLast ? '└── ' : '├── ';
    tree += `${prefix}${connector}${file.name}\n`;
  });

  return tree;
}

// 🔧 Customize this path to your project root
const projectRoot = path.resolve(__dirname, 'src'); // or 'C:/Users/rudij/Documents/Projects/cazzyjobs/src'
const output = `CAZZYJOBS/\n${generateTree(projectRoot, '│   ')}`;

fs.writeFileSync('project-tree.md', output);
console.log('✅ Project tree saved to project-tree.md');

// To run the script in node, use: 'node generateTree.js' command 
// in the terminal