var OneBanana = (function() {

    /**
     * Creates a new test suite, using the given configuration options
     * to override the default configuration. The default
     * configuration will apply EXCEPT where specified by the options
     * object. In other words, if the default specifies values a, b,
     * and c, and the options object specifies just c, then the
     * default values for a and b will be used, and the options value
     * for c.
     *
     * @param options - configuration options to be used for this instance. (Details above.)
     */
    function Suite(options) {
        var self = this;
        var tests = [];

        options = getOptions(options);
        this.name = options.name;
        this.passed = 0;
        this.failed = 0;
        this.listeners = new Suite.CompositeListener(options.listeners, options.renderer);

        this.setup = function() {
            options.setup && options.setup();
        };

        this.teardown = function() {
            options.teardown && options.teardown();
        };

        this.testAsync = function() {
            for (var i = 0; i < arguments.length; i++) {
                var f = arguments[i];
                var t = new Suite.Test(f, self, true);
                tests.push(t);
            }
            self.run();
        };

        this.test = function() {
            for (var i = 0; i < arguments.length; i++) {
                var f = arguments[i];
                var t = new Suite.Test(f, self);
                tests.push(t);

            }
            return self.run();
        };

        this.run = function(k) {
            reset();
            self.listeners.suiteStart(self);
            var next = (function() {
                var i = -1;
                return function() {
                    i++;
                    if (i < tests.length) {
                        var test = tests[i];
                        test.run(function() {
                            self.passed += test.passed;
                            self.failed += test.failed;
                            next();
                        });
                    }
                    else {
                        self.listeners.suiteDone(self);
                        if (k) k();
                    }
                };
            })();
            next();
            return self.failed;
        }

        function reset() {
            self.passed = 0;
            self.failed = 0;
        }
    }

    Suite.Asserts = function Asserts(test) {
        var self = this;
        var callChecks = [];
        var okCount = 0;

        /**
         * Assert that the first argument is truthy.
         *
         * @param bool - The expression to evaluate for truthiness.
         * @param msg - A message to display for this assertion.
         */
        this.ok = function(bool, msg) {
            okCount++;
            bool ? test.pass(msg) : test.fail(msg);
        };

        /**
         * Fail the test immediately.
         */
        this.fail = function(msg) {
            test.fail(msg);
        };

        /**
         * Assert that the specified number of assertions will be made
         * during the test.
         */
        this.expect = function(n) {
            callChecks.push(function() {
                if (n != okCount) {
                    test.fail("Expected " + n + " calls to 'ok', received " + okCount + ".");
                }
                else {
                    test.pass("Expected assertions (" + n + ") complete.");
                }
            });
        };

        /**
         * Assert that the specified function is called during the
         * test. If 'times' is specified, the method must be called
         * exactly that number of times. Otherwise, the method must
         * simply be called one or more times.
         *
         * @param obj - the object whose method must be called.
         * @param funcName - the name of the method which must be called.
         * @param times - (Optional) The number of times the method must be called.
         */
        this.mustCall = function(obj, funcName, times) {
            var check = function() {
                if (!times && count > 0) {
                    test.pass("Function " + funcName + " was called.");
                }
                else if (!times) {
                    test.fail("Function " + funcName + " was not called.");
                }
                else if (count == times) {
                    test.pass("Function " + funcName + " was called " + count + " times.");
                }
                else {
                    test.fail("Function " + funcName + " was called " + count + " times, not " + times);
                }
            };
            var count = 0;
            callChecks.push(check);
            obj[funcName] = (function(original) {
                return function() {
                    count++;
                    original.apply(obj, arguments);
                };
            }(obj[funcName]));

        };

        /**
         * Assert that the specified function must NOT be called
         * during the test.
         *
         * @param obj - The object whose member method must not be called.
         * @param funcName - The name of the member function that must not be called.
         */
        this.mustNotCall = function(obj, funcName) {
            self.mustCall(obj, funcName, 0);
        };

        this.checkCalled = function() {
            while (callChecks.length) {
                var c = callChecks.pop();
                c();
            }
        };
    };

    Suite.Test = function Test(f, suite, asynchronous) {
        var self = this;
        this.name = f.name || "anonymous";
        this.passed = 0;
        this.failed = 0;
        this.run = function(k) {
            reset();
            var a = new Suite.Asserts(self);
            suite.listeners.testStart(self);
            function done() {
                a.checkCalled();
                suite.listeners.testDone(self);
                suite.teardown();
                k();
            }
            try {
                suite.setup();
                if (asynchronous) {
                    f(a, done);
                }
                else {
                    f(a);
                    done();
                }            
            }
            catch (e) {
                self.fail(e);
                k();
            }
        }
        this.pass = function(msg) {
            suite.listeners.assertPassed(msg || "ok");
            self.passed++;
        };
        this.fail = function(msg) {
            suite.listeners.assertFailed(msg || "ok");
            self.failed++;
        };

        function reset() {
            self.passed = 0;
            self.failed = 0;
        }
    };

    /**
     * Renders test results to the console.
     */
    Suite.ConsoleRenderer = function ConsoleRenderer(c) {
        c = c || console;
        this.log = function(msg) {
            c.log("    " + msg);
        },
        this.assertPassed = function(msg) {
            c.log("    " + msg);
        },
        this.assertFailed = function(msg) {
            c.log("  * FAILED: " + msg);
        },
        this.testStart = function(test) {
            c.log(test.name + ":");
        },
        this.testDone = function (test) {
            var status = "(p: " + test.passed + ", f: " + test.failed + ")";
            c.log("    " + (test.failed ? "FAILED" : "PASSED") + " " + status);
        },
        this.suiteStart = function(suite) {
            c.log("Suite: " + suite.name);
        },
        this.suiteDone = function(suite) {
            c.log("Finished Suite: " + suite.name);
            c.log("    asserts passed: " + suite.passed);
            c.log("    asserts failed: " + suite.failed);
            c.log("SUITE " + ((suite.failed) ? "FAILED" : "PASSED"));
        };
    };

    /**
     * Superclass for objects that want to listen for events during
     * testing.
     */
    Suite.SuiteListener = function() {
        this.log = function() {};
        this.assertPassed = function() {};
        this.assertFailed = function() {};
        this.testStart = function() {};
        this.testDone = function() {};
        this.suiteStart = function() {};
        this.suiteDone = function() {};
    };

    /**
     * Serves as a nice way to delegate to multiple listeners.
     */
    Suite.CompositeListener = function(listeners, renderer) {
        var listeners = listeners || [];
        if (renderer) listeners.push(renderer); // The renderer is just another listener.
        this.log = function(msg) {
            listeners.map(function(l) { l.log(msg); });
        };
        this.assertPassed = function(msg) {
            listeners.map(function(l) { l.assertPassed(msg); });
        };
        this.assertFailed = function(msg) {
            listeners.map(function(l) { l.assertFailed(msg); });
        };
        this.testStart = function(msg) {
            listeners.map(function(l) { l.testStart(msg); });
        };
        this.testDone = function(msg) {
            listeners.map(function(l) { l.testDone(msg); });
        };
        this.suiteStart = function(msg) {
            listeners.map(function(l) { l.suiteStart(msg); });
        };
        this.suiteDone = function(msg) {
            listeners.map(function(l) { l.suiteDone(msg); });
        };
        this.add = function(l) {
            if (l) listeners.push(l);
        };
        this.contains = function(l) {
            return listeners.indexOf(l) > -1;
        };
    };
    Suite.CompositeListener.prototype = new Suite.SuiteListener();

    /**
     * Renders test results to the console.
     */
    Suite.ConsoleRenderer = function ConsoleRenderer(c) {
        c = c || console;
        this.log = function(msg) {
            c.log("    " + msg);
        },
        this.assertPassed = function(msg) {
            c.log("    " + msg);
        },
        this.assertFailed = function(msg) {
            c.log("  * FAILED: " + msg);
        },
        this.testStart = function(test) {
            c.log(test.name + ":");
        },
        this.testDone = function (test) {
            var status = "(p: " + test.passed + ", f: " + test.failed + ")";
            c.log("    " + (test.failed ? "FAILED" : "PASSED") + " " + status);
        },
        this.suiteStart = function(suite) {
            c.log("Suite: " + suite.name);
        },
        this.suiteDone = function(suite) {
            c.log("Finished Suite: " + suite.name);
            c.log("    asserts passed: " + suite.passed);
            c.log("    asserts failed: " + suite.failed);
            c.log("SUITE " + ((suite.failed) ? "FAILED" : "PASSED"));
        };
    };
    Suite.ConsoleRenderer.prototype = new Suite.SuiteListener();


    /**
     * Renders test results to the DOM.
     */
    Suite.DomRenderer = function DomRenderer(container, doc) {
        doc = doc || window.document;
        container = getContainer(container);
        this.suiteStart = function(suite) {
            container.innerHTML = "";
            var title = doc.createElement("h1");
            title.appendChild(doc.createTextNode(suite.name));
            var link = buildReRunLink(function() {
                reset();
                suite.run();
            });
            title.appendChild(doc.createTextNode(" "));
            title.appendChild(link);
            container.appendChild(title);
        };

        this.suiteDone = function(suite) {
            var div = doc.createElement("div");
            div.appendChild(doc.createTextNode(
                "SUITE " + ((suite.failed) ? "FAILED" : "PASSED") +
                    " (p: " + suite.passed + ", f: " + suite.failed +")"
            ));
            container.appendChild(div);
        };

        this.testStart = function(test) {
            var title = doc.createElement("h2");
            title.appendChild(doc.createTextNode(test.name));
            title.appendChild(doc.createTextNode(" "));
            var link = buildReRunLink(function() {
                reset();
                test.run();
            });
            title.appendChild(link);
            container.appendChild(title);
        };

        this.assertPassed = function(msg) {
            var div = doc.createElement("div");
            div.appendChild(doc.createTextNode(msg));
            container.appendChild(div);
        };

        this.assertFailed = function(msg) {
            var div = doc.createElement("div");
            div.appendChild(doc.createTextNode("FAILED: " + msg));
            container.appendChild(div);
        };

        this.testDone = function(test) {
            var div = doc.createElement("div");
            var status = test.name
                + ": " + (test.failed ? "FAILED" : "PASSED")
                + " (p: " + test.passed + ", f: " + test.failed + ")";
            div.appendChild(doc.createTextNode(status));
            container.appendChild(div);
            
        };

        function reset() {
            container.innerHTML = "";
        }

        function buildReRunLink(f) {
            var link = doc.createElement("a");
            link.appendChild(doc.createTextNode("(re-run)"));
            link.addEventListener("click", f);
            return link;
        }

        function getContainer(x) {
            switch (typeof x) {
            case "string":
                return doc.getElementById(x);
                break;
            case "undefined":
                return doc.getElementById("monkeytest");
            default:
                return x;
            }
        }
    };
    Suite.DomRenderer.prototype = new Suite.SuiteListener();

    /**
     * Establish new default config for Suite instances. This takes
     * the new options AS-IS. They completely overwrite the existing
     * configuration.
     */
    Suite.configure = function(options) {
        defaults = options;
    };

    /**
     * Get the current default config.
     */
    Suite.getConfiguration = function() {
        var c = {};
        for (p in defaults) {
            c[p] = defaults[p];
        }
        return c;
    };

    function getOptions(options) {
        options = options || {};
        options.name = options.name || defaults.name;
        options.renderer = options.renderer || defaults.renderer;
        options.listeners = Array.prototype.concat(
            (options.listeners || []),
            defaults.listeners
        );
        return options;
    };

    var defaults = {
        renderer: new Suite.ConsoleRenderer(console),
        listeners: []
    };

    return Suite;
}());