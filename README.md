OneBanana
=========

OneBanana is a JavaScript testing framework built around the idea that testing JavaScript should be as straight-forward as possible. 

I typically use it with [PhantomJS](http://phantomjs.org/) (and
[runtest.js](https://github.com/craser/OneBanana/blob/master/runtest.js)
relies on it), but you don't have to. Use whatever runtime you like.


Running on the Command Line
---------------------------


A typical file used to run a OneBanana test suite looks like this (see [runtest.js](https://github.com/craser/OneBanana/blob/master/runtest.js)):

    fs = require('fs');
    eval(fs.read('onebanana.js'));
    var pass = eval(fs.read('onebanana-test.js'));
    phantom.exit(pass);

By default, OneBanana emits test result information via the JavaScript console. Create a new OneBanana suite, and call its `test` method (see [onebanana-test.js](https://github.com/craser/OneBanana/blob/master/onebanana-test.js)):

    new OneBanana({ name: "Test Suite" }).test( // Create a new OneBanana test suite, emitting to the console.
        function test_foo(asserts) {...}, // These functions perform your tests.
        function test_bar(asserts) {...}, 
        function test_zaz(asserts) {...}
    );

Information about assertions, tests, and runtime errors will be emitted via `console.log`, and the `test` method will return the number of failed tests.

Running in the Browser
----------------------

If you prefer, you can run tests in a browser. Create an HTML file:

    <html>
        <head>
            <title>My Tests</title>
        </head>
        <body>
            <script src="onebanana.js"> </script>
            <script src="mytests.js"> </script>
        </body>
    </html>


In your test file (*mytests.js* in this example), tell OneBanana to use a DomRenderer:

    new OneBanana({ name: "Test Suite", renderer: new OneBanana.DomRenderer() }).test( // Create a test suite.
        function test_foo(asserts) {...}, // These functions perform your tests.
        function test_bar(asserts) {...}, 
        function test_zaz(asserts) {...}
    );


Test Functions
--------------

A tiny example of a OneBanana suite with one trivial test looks like this:

    new OneBanana({ name: "Trivial Suite" }).test(
        function silly_test(asserts) {
            asserts.ok(true, "Check that true == true");
        }
    );

This runs a new test suite with a single test function. OneBanana passes an instance of `OneBanana.Asserts` to each test function. `OneBanana.Asserts` offers several methods:

  - ```ok(check, message)```: Asserts that check is true, and passes the message with the results to the console.
  - ```fail(message)```: The test fails, passing the given message to the console.
  - ```expect(number)```: Tell the test how many assertions to expect for this test.
  - ```mustCall(obj, methodName)```: This test will fail if the specified method is *not* called.
  - ```mustNotCall(obj, methodName)```: This test will fail if the specified method *is* called.


    
