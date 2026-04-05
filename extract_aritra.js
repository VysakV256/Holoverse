import fs from 'fs';

const data = JSON.parse(fs.readFileSync('/Users/vysak/Downloads/nova_hologram.json', 'utf-8'));
const images = data.baseImages;

images.forEach((imgStr, i) => {
  if (imgStr.startsWith('data:image')) {
    const base64Data = imgStr.replace(/^data:image\/\w+;base64,/, "");
    fs.writeFileSync(`./public/assets/aritra_${i+1}.png`, base64Data, 'base64');
  } else {
    // maybe it is already a path or standard string
    console.log(`Image ${i} is not base64.`);
  }
});
console.log("Images extracted successfully.");
