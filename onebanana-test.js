function MockRenderer() {
    this.log = function() {};
    this.assertPassed = function() {};
    this.assertFailed = function() {};
    this.testError = function() {};
    this.testStart = function() {};
    this.testDone = function() {};
    this.suiteDone = function() {};
    this.suiteStart = function() {};
}

function MockSuite(name) {
    this.name = name || "MockSuite";
    this.passed = 0;
    this.failed = 0;
    this.renderer = new MockRenderer();
    this.test = function() {};
    this.run = function() {};
}

function MockTest(name) {
    this.name = name || "MockTest";
    this.passed = 0;
    this.failed = 0;
    this.pass = function() {};
    this.fail = function() {};
    this.run = function() {};
}

function MockConsole() {
    this.log = function() {}
}

new OneBanana({ name: "OneBanana" }).test(
    function asserts_ok(test) {
        var t = new MockTest();
        t.pass = function(m) { test.ok(m === "PASS", "Assert passed"); };
        t.fail = function(m) { test.ok(m === "FAIL", "Assert failed"); };
        test.mustCall(t, "pass");
        test.mustCall(t, "fail");
        var a = new OneBanana.Asserts(t);
        a.ok(true, "PASS");
        a.ok(false, "FAIL");
    },
    function asserts_mustCall(test) {
        var t = new MockTest();
        var a = new OneBanana.Asserts(t);

        var obj = {};
        obj.m = function() { test.ok(true, "Called."); };
        a.mustCall(obj, "m");
        test.mustCall(obj, "m");
        obj.m();
    },
    function asserts_mustCall(test) {
        var t = new MockTest();
        var a = new OneBanana.Asserts(t);
        var obj = {
            a: function() {},
            b: function() {}
        };

        test.mustCall(t, "pass");
        test.mustCall(t, "fail");

        a.mustCall(obj, "a");
        a.mustCall(obj, "b");

        obj.a();
        a.checkCalled();
    },
    function asserts_mustNotCall(test) {
        var t = new MockTest();
        var a = new OneBanana.Asserts(t);
        var obj = {
            a: function() {},
            b: function() {}
        };

        test.mustCall(t, "pass");
        test.mustCall(t, "fail");

        a.mustNotCall(obj, "a");
        a.mustNotCall(obj, "b");

        obj.a();
        a.checkCalled();
    },
    function asserts_fail(test) {
        var t = new MockTest();
        t.fail = function(m) { test.ok((m === "FAIL"), "Message must be 'FAIL'"); };
        var a = new OneBanana.Asserts(t);
        test.mustCall(t, "fail");
        a.fail("FAIL");
    },
    function test_create(test) {
        var testFunc = function testFunc() {};
        var t = new OneBanana.Test(testFunc, new MockRenderer());
        test.ok((t.name === "testFunc"), "Name of Test must be testFunc");
        test.ok((t.passed == 0), "Must init with 0 passed tests.");
        test.ok((t.failed == 0), "Must init with 0 failed tests.");
        test.ok(t.pass, "Must have a 'pass' method.");
        test.ok(t.fail, "Must have a 'fail' method.");
        test.ok(t.run, "Must have a 'run' method.");
    },
    function test_pass(test) {
        var r = new MockRenderer();
        r.assertPassed = function(m) { test.ok((m === "PASS MESSAGE"), "Message must be 'PASS MESSAGE'"); };
        var t = new OneBanana.Test(function() {}, r);
        test.mustCall(r, "assertPassed");
        t.pass("PASS MESSAGE");
        test.ok(t.passed == 1, "Must reflect 1 passed test.");
        test.ok(t.failed == 0, "Must reflect 0 failed tests.");
    },
    function test_fail(test) {
        var r = new MockRenderer();
        r.assertFailed = function(m) { test.ok((m === "FAILED MESSAGE"), "Message must be 'FAILED MESSAGE'"); };
        var t = new OneBanana.Test(function() {}, r);
        test.mustCall(r, "assertFailed");
        t.fail("FAILED MESSAGE");
        test.ok(t.passed == 0, "Must reflect 0 passed test.");
        test.ok(t.failed == 1, "Must reflect 1 failed tests.");
    },
    function test_rerun(test) {
        var r = new MockRenderer();
        var t = new OneBanana.Test(function(t) { t.ok(false); t.ok(true); }, r);
        test.mustCall(r, "testStart", 2);
        test.mustCall(r, "testDone", 2);
        test.mustCall(r, "assertPassed", 2);
        test.mustCall(r, "assertFailed", 2);
        t.run(function() {});
        test.ok((t.passed == 1), "Must reflect 1 passed test.");
        test.ok((t.failed == 1), "Must reflect 1 failed test.");

        t.run(function() {}); // Run again.  Should get same results.
        test.ok((t.passed == 1), "Must reflect 1 passed test.");
        test.ok((t.failed == 1), "Must reflect 1 failed test.");
    },
    function suite_create(test) {
        var r = new MockRenderer();
        var suite = new OneBanana({ name: "SUITE", renderer: r});
        test.ok((suite.name === "SUITE"), "Suite name must be 'SUITE'.");
        test.ok((suite.renderer === r), "Renderer must be assigned correctly.");
    },
    function suite_test(test) {
        var r = new MockRenderer();
        var suite = new OneBanana({ name: "SUITE", renderer: r});
        test.ok((suite.name === "SUITE"), "Suite name must be 'SUITE'.");
        test.ok((suite.renderer === r), "Renderer must be assigned correctly.");
        
        test.mustCall(r, "assertPassed", 4);
        test.mustCall(r, "assertFailed", 5);
        test.mustCall(r, "testStart", 3);
        test.mustCall(r, "testDone", 3);
        test.mustCall(r, "suiteStart", 1);
        test.mustCall(r, "suiteDone", 1);
        suite.test(
            function a(t) {
                t.ok(true, "PASSED");
                t.ok(true, "PASSED");
                t.ok(false, "FAILED");
            },
            function b(t) {
                t.ok(true, "PASSED");
                t.ok(false, "FAILED");
            },
            function c(t){
                t.ok(true, "PASSED");
                t.ok(false, "FAILED");
                t.ok(false, "FAILED");
                t.ok(false, "FAILED");
            }
        );
        test.ok((suite.passed == 4), "Must reflect 4 passed asserts.");
        test.ok((suite.failed == 5), "Must reflect 5 failed asserts.");
    },
    function suite_rerun(test) {
        var r = new MockRenderer();
        var suite = new OneBanana({ name: "SUITE", renderer: r});
        test.ok((suite.name === "SUITE"), "Suite name must be 'SUITE'.");
        test.ok((suite.renderer === r), "Renderer must be assigned correctly.");
        
        test.mustCall(r, "assertPassed", 8);
        test.mustCall(r, "assertFailed", 10);
        test.mustCall(r, "testStart", 6);
        test.mustCall(r, "testDone", 6);
        test.mustCall(r, "suiteStart", 2);
        test.mustCall(r, "suiteDone", 2);
        suite.test(
            function a(t) {
                t.ok(true, "PASSED");
                t.ok(true, "PASSED");
                t.ok(false, "FAILED");
            },
            function b(t) {
                t.ok(true, "PASSED");
                t.ok(false, "FAILED");
            },
            function c(t){
                t.ok(true, "PASSED");
                t.ok(false, "FAILED");
                t.ok(false, "FAILED");
                t.ok(false, "FAILED");
            }
        );
        test.ok((suite.passed == 4), "Must reflect 4 passed asserts.");
        test.ok((suite.failed == 5), "Must reflect 5 failed asserts.");

        suite.run(); // rerun
        test.ok((suite.passed == 4), "Must reflect 4 passed asserts.");
        test.ok((suite.failed == 5), "Must reflect 5 failed asserts.");
    },
    function suite_testAsync(test) {
        var r = new MockRenderer();
        var suite = new OneBanana({ name: "SUITE", renderer: r});
        test.ok((suite.name === "SUITE"), "Suite name must be 'SUITE'.");
        test.ok((suite.renderer === r), "Renderer must be assigned correctly.");
        
        test.mustCall(r, "assertPassed", 4);
        test.mustCall(r, "assertFailed", 5);
        test.mustCall(r, "testStart", 3);
        test.mustCall(r, "testDone", 3);
        test.mustCall(r, "suiteStart", 1);
        test.mustCall(r, "suiteDone", 1);
        suite.testAsync(
            function a(t, k) {
                t.ok(true, "PASSED");
                t.ok(true, "PASSED");
                t.ok(false, "FAILED");
                k();
            },
            function b(t, k) {
                t.ok(true, "PASSED");
                t.ok(false, "FAILED");
                k();
            },
            function c(t, k){
                t.ok(true, "PASSED");
                t.ok(false, "FAILED");
                t.ok(false, "FAILED");
                t.ok(false, "FAILED");
                k();
            }
        );
        test.ok((suite.passed == 4), "Must reflect 4 passed asserts.");
        test.ok((suite.failed == 5), "Must reflect 5 failed asserts.");
    }
);

new OneBanana({ name: "ConsoleRenderer" }).test(
    function consoleRenderer(test) {
        function contains(s, c) { return s.indexOf(c) > -1; };
        var message = "";
        var console = new MockConsole();
        console.log = function(m) { message += m + "\\n"; };
        var r = new OneBanana.ConsoleRenderer(console);

        var t = new MockTest();
        t.passed = 57;
        t.failed = 71;

        var s = new MockSuite();
        s.passed = 23;
        s.failed = 13;

        for (p in r) {
            test.mustCall(r, p);
        }

        r.log("LOGMESSAGE");
        test.ok(contains(message, "LOGMESSAGE"), "Passed correct message: '" + message + "'");
        message = "";
 
        r.suiteStart(s);
        test.ok(contains(message, s.name), "Passed correct message: '" + message + "'");
        message = "";

        r.suiteDone(s);
        test.ok(contains(message, "SUITE"), "Passed correct message: '" + message + "'");
        test.ok(contains(message, "FAILED"), "Passed correct message: '" + message + "'");
        test.ok(contains(message, "23"), "Passed correct message: '" + message + "'");
        test.ok(contains(message, "13"), "Passed correct message: '" + message + "'");
        message = "";

        s.failed = 0;
        r.suiteDone(s);
        test.ok(contains(message, "SUITE"), "Passed correct message: '" + message + "'");
        test.ok(contains(message, "PASSED"), "Passed correct message: '" + message + "'");
        message = "";


        r.testStart(t);
        test.ok(contains(message, t.name), "Passed correct message: '" + message + "'");
        message = "";

        r.testDone(t);
        test.ok(contains(message, "FAILED"), "Passed correct message: '" + message + "'");
        test.ok(contains(message, "p: 57"), "Passed correct message: '" + message + "'");
        test.ok(contains(message, "f: 71"), "Passed correct message: '" + message + "'");
        message = "";

        r.assertPassed("ASSERTPASSED");
        test.ok(contains(message, "ASSERTPASSED"), "Passed correct message: '" + message + "'");
        message = "";

        r.assertFailed("ASSERTFAILED");
        test.ok(contains(message, "* FAILED: ASSERTFAILED"), "Passed correct message: '" + message + "'");
        message = "";

        r.testError("TESTERROR");
        test.ok(contains(message, "TESTERROR"), "Passed correct message: '" + message + "'");
        message = "";
    }
);
