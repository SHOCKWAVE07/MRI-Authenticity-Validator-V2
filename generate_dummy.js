import fs from 'fs';
import path from 'path';

const TARGET_DIR = path.resolve('raw_dataset');
const CASE_COUNT = 10;

// Minimal 1x1 pixel PNG (Base64 decoded)
// This is a red pixel.
const PNG_Buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKwM+AAAAABJRU5ErkJggg==', 'base64');

// We can vary the color slightly or just naming is enough for this app logic.
// The app logic mostly cares about filenames.

if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR);
}

console.log(`Generating ${CASE_COUNT} cases in ${TARGET_DIR}...`);

for (let i = 1; i <= CASE_COUNT; i++) {
    const caseId = `case_${i.toString().padStart(3, '0')}`;
    const caseDir = path.join(TARGET_DIR, caseId);

    if (!fs.existsSync(caseDir)) {
        fs.mkdirSync(caseDir);
    }

    // Write 3 files
    fs.writeFileSync(path.join(caseDir, 'input.png'), PNG_Buffer);
    fs.writeFileSync(path.join(caseDir, 'real.png'), PNG_Buffer);
    fs.writeFileSync(path.join(caseDir, 'synthetic.png'), PNG_Buffer);
}

console.log('Done! Created raw_dataset.');
