let fs = require('fs');
let re1 = /\/\/ \<\<[\s\S\n]+\/\/ \>\>/;
let re2 = /\/\/ \[\[[\s\S\n]+\/\/ \]\]/g;
let src = fs.readFileSync(process.argv[2], 'utf8');
let bezier = fs.readFileSync('node_modules/bezier-easing/src/index.js', 'utf8');

process.stdout.write(src.replace(re1, bezier).replace(re2, ''));

