OneBanana
=========

OneBanana is a JavaScript testing framework built around the idea that testing JavaScript should be as straight-forward as possible.

It does not require a DOM in which to render test results, so users need not create HTML files for tests. A very small .js file will do. (See runtest.js, which tests the OneBanana framework using the PhantomJS runtime.)

    fs = require('fs');
    eval(fs.read('onebanana.js'));
    var pass = eval(fs.read('onebanana-test.js'));
    phantom.exit(pass);```


However, if you prefer, you can run tests in a browser by telling your suite to use a DomRenderer:

    new OneBanana("Test Suite", { renderer: new OneBanana.DomRenderer() }).test(...);


