const fs = require('fs');
const content = fs.readFileSync('uplode_que.php', 'utf8');
const regex = /"category"\s*=>\s*"([^"]+)"/g;
const counts = {};
let match;
while ((match = regex.exec(content)) !== null) {
    const cat = match[1];
    counts[cat] = (counts[cat] || 0) + 1;
}
console.log('Categories and counts in PHP file:', counts);
