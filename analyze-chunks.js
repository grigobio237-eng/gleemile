const fs = require('fs');
['9330.js', '4352.js', '441.js'].forEach(f => {
  try {
    const c = fs.readFileSync('.next/server/chunks/' + f, 'utf8');
    console.log('\n--- ' + f + ' ---');
    console.log(c.substring(0, 150));
    console.log(c.match(/require\("[^"]+"\)/g)?.slice(0, 5) || 'No requires');
  } catch (e) {
    console.log(e.message);
  }
});
