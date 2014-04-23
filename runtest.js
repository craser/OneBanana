fs = require('fs');
eval(fs.read('onebanana.js'));
eval(fs.read('onebanana-test.js'));
phantom.exit();