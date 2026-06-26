const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'public', 'images');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.png'));

async function convert() {
  for (const file of files) {
    const input = path.join(dir, file);
    const output = path.join(dir, file.replace('.png', '.webp'));
    try {
      await sharp(input).webp({ quality: 80 }).toFile(output);
      console.log(`Converted ${file} to ${file.replace('.png', '.webp')}`);
      // fs.unlinkSync(input); // Optional: delete original
    } catch (err) {
      console.error(`Error converting ${file}:`, err);
    }
  }
}

convert();
