// Run with PhantomJS.
fs = require('fs');
eval(fs.read('onebanana.js'));
var pass = eval(fs.read('onebanana-test.js'));
phantom.exit(pass);
