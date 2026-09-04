import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.dirname(__dirname);

console.log('1. Generating 1024x1024 full-bleed solid white app-icon.png...');
execSync('python3 ' + path.join(__dirname, 'composite-icon.py'), { stdio: 'inherit', cwd: projectRoot });

console.log('2. Compiling platform icons with Tauri CLI...');
execSync('pnpm tauri icon app-icon.png', { stdio: 'inherit', cwd: projectRoot });

console.log('Done! All icons in src-tauri/icons/ updated successfully.');
