const fs = require('fs');

const distPath = 'dist/manifest.json';

const files = fs.readdirSync('dist');

const scripts = files.filter(file => file.startsWith('main') || file.startsWith('runtime') || file.startsWith('polyfills'));
const styles = files.filter(file => file.startsWith('styles'));

const manifest = {
    scripts,
    styles
}

fs.writeFileSync(distPath, JSON.stringify(manifest));