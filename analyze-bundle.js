const fs = require('fs');
const content = fs.readFileSync('.open-next/assets/_worker.js/index.js', 'utf8');

// recharts 문자열 주변 컨텍스트 출력
const regex = /recharts/g;
let match;
let count = 0;
while ((match = regex.exec(content)) !== null) {
  const start = Math.max(0, match.index - 100);
  const end = Math.min(content.length, match.index + 100);
  console.log(`\n--- Match ${++count} at position ${match.index} ---`);
  console.log(content.substring(start, end));
}

// jspdf 참조 확인
const jspdfRegex = /jspdf/g;
let jspdfCount = 0;
let jspdfMatch;
while ((jspdfMatch = jspdfRegex.exec(content)) !== null) {
  const start = Math.max(0, jspdfMatch.index - 80);
  const end = Math.min(content.length, jspdfMatch.index + 80);
  console.log(`\n--- jspdf Match ${++jspdfCount} ---`);
  console.log(content.substring(start, end));
  if (jspdfCount >= 3) break;
}
