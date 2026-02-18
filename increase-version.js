const fs = require('fs');
const path = require('path');

const envFiles = [
    'src/enviroment/environment.prod.ts',
    'src/enviroment/environment.base.ts'
];

function incrementVersion(content) {
    const versionRegex = /appVersion:\s*'v(\d+)\.(\d+)\.(\d+)-stable'/;
    const match = content.match(versionRegex);

    if (match) {
        const major = match[1];
        const minor = match[2];
        const patch = parseInt(match[3], 10) + 1;
        const newVersion = `v${major}.${minor}.${patch}-stable`;
        const newContent = content.replace(versionRegex, `appVersion: '${newVersion}'`);
        console.log(`Updated to ${newVersion}`);
        return newContent;
    }
    return null;
}

envFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        const newContent = incrementVersion(content);
        if (newContent) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log(`Updated ${file}`);
        } else {
            console.log(`Version pattern not found in ${file}`);
        }
    } else {
        console.log(`File not found: ${file}`);
    }
});
