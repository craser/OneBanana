function MockRenderer() {
    this.log = function() {};
    this.assertPassed = function() {};
    this.assertFailed = function() {};
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
    this.setup = function() {};
    this.teardown = function() {};
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

// this.suiteStart = function(suite) {
//     container.innerHTML = "";
//     var title = document.createElement("h1");
//     title.appendChild(document.createTextNode(suite.name));
//     var link = buildReRunLink(function() {
//         reset();
//         suite.run();
//     });
//     title.appendChild(document.createTextNode(" "));
//     title.appendChild(link);
//     container.appendChild(title);
// };



function MockNode(tag) {
    this.children = [];
    this.attributes = {};
    this.listeners = {};

    this.tagName = tag;

    this.appendChild = function(child) {
        this.children.push(child);
    };
    this.getChild = function(tag) {
        var matches = this.children.filter(function(child) { return child.tagName == tag; });
        return (matches.length > 0) ? matches[0] : null;
    };
    this.addEventListener = function(event, listener) {
        if (!(event in this.listeners)) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(listener);
    };
    this.toString = function() {
        var s = "<" + tag;
        for (a in this.attributes) {
            s += " " + a + "=\"" + this.attributes[a] + "\"";
        }
        s += ">";
        this.children.forEach(function(child) {
            s += child;
        });
        s += "</" + tag + ">";
        return s;
    };
}

function MockText(text) {
    MockNode.call(this, "text");
    this.toString = function() {
        return text;
    };
}

function MockDocument() {
    this.createElement = function(tag) {
        return new MockNode(tag);
    };
    this.createTextNode = function(text) {
        return new MockText(text);
    };
}

new OneBanana({ name: "Asserts" }).test(
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
    function asserts_expect_pass(test) {
        var t = new MockTest();
        var a = new OneBanana.Asserts(t);

        a.expect(3);
        a.ok(true, "PASSED");
        a.ok(true, "PASSED");
        a.ok(true, "PASSED");

        test.mustCall(t, "pass");
        a.checkCalled();
    },
    function asserts_expect_out_of_order(test) {
        var t = new MockTest();
        var a = new OneBanana.Asserts(t);

        a.ok(true, "PASSED");
        a.ok(true, "PASSED");
        a.ok(true, "PASSED");
        a.expect(3); // AFTER ok called.

        test.mustCall(t, "pass");
        a.checkCalled();
    },
    function asserts_expect_fail(test) {
        var t = new MockTest();
        var a = new OneBanana.Asserts(t);

        a.expect(3);
        a.ok(true, "PASSED");
        //a.ok(true, "PASSED");
        a.ok(true, "PASSED");

        test.mustCall(t, "fail");
        a.checkCalled();
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
    function asserts_mustCallTimes(test) {
        var t = new MockTest();
        var a = new OneBanana.Asserts(t);
        var obj = {
            a: function() {},
            b: function() {}
        };

        test.mustCall(t, "pass");
        test.mustCall(t, "fail");

        a.mustCall(obj, "a", 3);
        a.mustCall(obj, "b", 7);

        obj.a();
        obj.a();
        obj.a();

        obj.b();
        obj.b();
        obj.b();

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
    }
);

new OneBanana({ name: "Test" }).test(
    function test_create(test) {
        var testFunc = function testFunc() {};
        var t = new OneBanana.Test(testFunc, new MockSuite());
        test.ok((t.name === "testFunc"), "Name of Test must be testFunc");
        test.ok((t.passed == 0), "Must init with 0 passed tests.");
        test.ok((t.failed == 0), "Must init with 0 failed tests.");
        test.ok(t.pass, "Must have a 'pass' method.");
        test.ok(t.fail, "Must have a 'fail' method.");
        test.ok(t.run, "Must have a 'run' method.");
    },
    function test_pass(test) {
        var s = new MockSuite();
        s.renderer.assertPassed = function(m) { test.ok((m === "PASS MESSAGE"), "Message must be 'PASS MESSAGE'"); };
        var t = new OneBanana.Test(function() {}, s);
        test.mustCall(s.renderer, "assertPassed");
        t.pass("PASS MESSAGE");
        test.ok(t.passed == 1, "Must reflect 1 passed test.");
        test.ok(t.failed == 0, "Must reflect 0 failed tests.");
    },
    function test_fail(test) {
        var s = new MockSuite();
        s.renderer.assertFailed = function(m) { test.ok((m === "FAILED MESSAGE"), "Message must be 'FAILED MESSAGE'"); };
        var t = new OneBanana.Test(function() {}, s);
        test.mustCall(s.renderer, "assertFailed");
        t.fail("FAILED MESSAGE");
        test.ok(t.passed == 0, "Must reflect 0 passed test.");
        test.ok(t.failed == 1, "Must reflect 1 failed tests.");
    },
    function test_rerun(test) {
        var s = new MockSuite();
        var t = new OneBanana.Test(function(t) { t.ok(false); t.ok(true); }, s);
        test.mustCall(s.renderer, "testStart", 2);
        test.mustCall(s.renderer, "testDone", 2);
        test.mustCall(s.renderer, "assertPassed", 2);
        test.mustCall(s.renderer, "assertFailed", 2);
        t.run(function() {});
        test.ok((t.passed == 1), "Must reflect 1 passed test. (passed: " + t.passed + ")");
        test.ok((t.failed == 1), "Must reflect 1 failed test. (failed: " + t.failed + ")");
        
        t.run(function() {}); // Run again.  Should get same results.
        test.ok((t.passed == 1), "Must reflect 1 passed test. (passed: " + t.passed + ")");
        test.ok((t.failed == 1), "Must reflect 1 failed test. (failed: " + t.failed + ")");
    },
    function test_setup_teardown(test) {
        var s = new MockSuite();
        var t = new OneBanana.Test(function(t) { t.ok(true); }, s);
        test.mustCall(s, "setup");
        test.mustCall(s, "teardown");

        t.run(function() {}); //
        test.ok((t.passed = 1), "Run the test.");
    }
);

new OneBanana({ name: "Suite" }).test(
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
        var failed = suite.test(
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
        test.ok((failed == 5), "Correct number failed: " + failed);
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
        var failed = suite.test(
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
        test.ok((failed == 5), "Correct number failed: " + failed);
        
        failed = suite.run(); // rerun
        test.ok((suite.passed == 4), "Must reflect 4 passed asserts.");
        test.ok((suite.failed == 5), "Must reflect 5 failed asserts.");
        test.ok((failed == 5), "Correct number failed: " + failed);
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
            function c(t, k) {
                t.ok(true, "PASSED");
                t.ok(false, "FAILED");
                t.ok(false, "FAILED");
                t.ok(false, "FAILED");
                k();
            }
        );
        test.ok((suite.passed == 4), "Must reflect 4 passed asserts.");
        test.ok((suite.failed == 5), "Must reflect 5 failed asserts.");
    },
    function suite_setup(test) {
        var numCalled = 0;
        var r = new MockRenderer();
        var suite = new OneBanana({
            name: "SUITE",
            renderer: r,
            setup: function() { numCalled++; }
        });
        test.mustCall(suite, "setup", 3);
        suite.test(
            function a(t) { t.ok(true, "PASSED"); },
            function b(t) { t.ok(true, "PASSED"); },
            function c(t) { t.ok(true, "PASSED"); }
        );
        test.ok((numCalled == 3), "Can't just call suite.setup, must actually call setup function. (numCalled: " + numCalled + ")");
    },
    function suite_teardown(test) {
        var numCalled = 0;
        var r = new MockRenderer();
        var suite = new OneBanana({
            name: "SUITE",
            renderer: r,
            teardown: function() { numCalled++; }
        });
        test.mustCall(suite, "teardown", 3);
        suite.test(
            function a(t) { t.ok(true, "PASSED"); },
            function b(t) { t.ok(true, "PASSED"); },
            function c(t) { t.ok(true, "PASSED"); }
        );
        test.ok((numCalled == 3), "Can't just call suite.teardown, must actually call the teardown function. (numCalled: " + numCalled + ")");
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

        for (p in r) { // Make sure we call everything.
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
    }
);

new OneBanana({ name: "DomRenderer" }).test(
    function domRenderer_extends_consoleRenderer(test) {
        var doc = new MockDocument();
        var container = doc.createElement("div");
        var domRenderer = new OneBanana.DomRenderer(container, doc);

        var c = new MockConsole();
        var consoleRenderer = new OneBanana.ConsoleRenderer(c);

        for (p in consoleRenderer) {
            test.ok((p in domRenderer), "DomRenderer must have property \"" + p + "\"");
        }
    },
    function domRenderer_suiteStart(test) {
        function contains(s, t) { return s.indexOf(t) != -1; };
        var doc = new MockDocument();
        var container = doc.createElement("div");
        var r = new OneBanana.DomRenderer(container, doc);

        var s = new MockSuite("SUITE");
        r.suiteStart(s);

        test.ok(container.getChild("h1"), "Must have an h1 child.");
        var h1 = container.getChild("h1");
        
        test.ok(container.toString() == "<div><h1>SUITE <a>(re-run)</a></h1></div>", "Must produce HTML: <div><h1>SUITE <a>(re-run)</a></h1></div>");
        var reRun = h1.getChild("a").listeners["click"][0];
        test.ok((typeof reRun) == "function", "Re-run must be a function. (Found: " + (typeof reRun) + ")");
        test.ok(reRun, "Must have a click handler to re-run test.");
        

        test.mustCall(s, "run", 1);   // Must re-run the suite *once*.
        try {
            reRun();
        }
        catch (e) {
            test.fail("Exception calling re-run handler: " + e);
        }
    },
    function domRenderer_suiteDone_passed(test) {
        var doc = new MockDocument();
        var container = doc.createElement("div");
        var s = new MockSuite("SUITE");
        s.passed = 17;
        s.failed = 0;

        var r = new OneBanana.DomRenderer(container, doc);
        r.suiteDone(s);

        test.ok(container.toString() == "<div><div>SUITE PASSED (p: 17, f: 0)</div></div>", "Must produce HTML: <div>SUITE PASSED (p: 17, f: 0)</div>");
    },
    function domRenderer_suiteDone_failed(test) {
        var doc = new MockDocument();
        var container = doc.createElement("div");
        var s = new MockSuite("SUITE");
        s.passed = 17;
        s.failed = 3;

        var r = new OneBanana.DomRenderer(container, doc);
        r.suiteDone(s);

        test.ok(container.toString() == "<div><div>SUITE FAILED (p: 17, f: 3)</div></div>", "Must produce HTML: <div>SUITE FAILED (p: 17, f: 3)</div>");
    },
    function domRenderer_testStart(test) {
        var doc = new MockDocument();
        var container = doc.createElement("div");
        var t = new MockTest("TEST");

        var r = new OneBanana.DomRenderer(container, doc);
        r.testStart(t);

        test.ok(container.toString() == "<div><h2>TEST <a>(re-run)</a></h2></div>", "Must produce HTML: <div><h2>TEST <a>(re-run)</a></h2></div>");
        var reRun = container.getChild("h2").getChild("a").listeners["click"][0];

        test.ok((typeof reRun) == "function", "Re-run must be a function. (Found: " + (typeof reRun) + ")");
        test.ok(reRun, "Must have a click handler to re-run test.");
        test.mustCall(t, "run", 1);   // Must re-run the suite *once*.
        try {
            reRun();
        }
        catch (e) {
            test.fail("Exception calling re-run handler: " + e);
        }
    },
    function domRenderer_assertPassed(test) {
        var doc = new MockDocument();
        var container = doc.createElement("div");

        var r = new OneBanana.DomRenderer(container, doc);
        r.assertPassed("TEST MESSAGE");
        test.ok(container.toString() == "<div><div>TEST MESSAGE</div></div>", "Must produce HTML: <div><div>TEST MESSAGE</div></div>");
    },
    function domRenderer_assertFailed(test) {
        var doc = new MockDocument();
        var container = doc.createElement("div");

        var r = new OneBanana.DomRenderer(container, doc);
        r.assertFailed("TEST MESSAGE");
        test.ok(container.toString() == "<div><div>FAILED: TEST MESSAGE</div></div>", "Must produce HTML: <div><div>FAILED: TEST MESSAGE</div></div>");
    },
    function domRenderer_testDone_passed(test) {
        var doc = new MockDocument();
        var container = doc.createElement("div");
        var t = new MockTest("TEST");
        t.passed = 17;
        t.failed = 0;

        var r = new OneBanana.DomRenderer(container, doc);
        r.testDone(t);

        test.ok(container.toString() == "<div><div>TEST: PASSED (p: 17, f: 0)</div></div>", "Must produce HTML: <div><div>TEST: PASSED (p: 17, f: 0)</div></div>");
    },
    function domRenderer_testDone_failed(test) {
        var doc = new MockDocument();
        var container = doc.createElement("div");
        var t = new MockTest("TEST");
        t.passed = 17;
        t.failed = 3;

        var r = new OneBanana.DomRenderer(container, doc);
        r.testDone(t);

        test.ok(container.toString() == "<div><div>TEST: FAILED (p: 17, f: 3)</div></div>", "Must produce HTML: <div><div>TEST: FAILED (p: 17, f: 3)</div></div>");
    }
);

