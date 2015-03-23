OneBanana
=========

OneBanana is a JavaScript testing framework built around the idea that testing JavaScript should be as straight-forward as possible.



A typical file used to run a OneBanana test suite looks like this (see [runtest.js](https://github.com/craser/OneBanana/blob/master/runtest.js)):

    fs = require('fs');
    eval(fs.read('onebanana.js'));
    var pass = eval(fs.read('onebanana-test.js'));
    phantom.exit(pass);

By default, OneBanana emits test result information via the JavaScript console. Create a new OneBanana suite, and call its `test` method (see [onebanana-test.js](https://github.com/craser/OneBanana/blob/master/onebanana-test.js)):

    new OneBanana("Test Suite").test( // Create a new OneBanana test suite, emitting to the console.
        function test_foo(test) {...}, // These functions perform your tests.
        function test_bar(test) {...}, 
        function test_zaz(test) {...}
    );

Information about assertions, tests, and runtime errors will be emitted via `console.log`, and the `test` method will return the number of failed tests.


If you prefer, you can run tests in a browser by telling your suite to use a DomRenderer:

    new OneBanana("Test Suite", { renderer: new OneBanana.DomRenderer() }).test( // Create a new OneBanana test suite.
        function test_foo(test) {...}, // These functions perform your tests.
        function test_bar(test) {...}, 
        function test_zaz(test) {...}
    );


