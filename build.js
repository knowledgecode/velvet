var fs = require('fs');
var re = /\/\/ \[\[[\s\S\n]+\/\/ \]\]/g;

var text = fs.readFileSync(process.argv[2], 'utf8');
process.stdout.write(text.replace(re, ''));

