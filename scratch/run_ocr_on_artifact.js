const fs = require('fs');
const path = require('path');
const { extractImageText } = require('../services/ocrService');

async function run() {
  try {
    const filePath = 'C:/Users/USER/.gemini/antigravity-ide/brain/91dcfe34-9188-4ff5-bfbf-33ea489bbc1c/media__1784650045525.jpg';
    if (!fs.existsSync(filePath)) {
      console.error(`File does not exist: ${filePath}`);
      return;
    }
    console.log('Running OCR on:', filePath);
    const buffer = fs.readFileSync(filePath);
    const text = await extractImageText(buffer);
    
    fs.writeFileSync('c:/Users/USER/Desktop/zenscore-backend/zenscore-backend/scratch/raw_extracted_text.txt', text);
    console.log('Successfully saved text to scratch/raw_extracted_text.txt');
  } catch (err) {
    console.error('Error during OCR extraction:', err);
  }
}
run();
