var OneBanana = (function() {

    function Suite(options) {
        var self = this;
        var tests = [];

        options = getOptions(options);
        this.name = options.name;
        this.passed = 0;
        this.failed = 0;
        this.renderer = new Suite.Renderer(options.renderer);

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
            self.renderer.suiteStart(self);
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
                        self.renderer.suiteDone(self);
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
        this.ok = function(bool, msg) {
            okCount++;
            bool ? test.pass(msg) : test.fail(msg);
        };
        this.fail = function(msg) {
            test.fail(msg);
        };
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
            suite.renderer.testStart(self);
            function done() {
                a.checkCalled();
                suite.renderer.testDone(self);
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
            suite.renderer.assertPassed(msg || "ok");
            self.passed++;
        };
        this.fail = function(msg) {
            suite.renderer.assertFailed(msg || "ok");
            self.failed++;
        };

        function reset() {
            self.passed = 0;
            self.failed = 0;
        }
    };

    Suite.Renderer = function Renderer(def) {
        var defaults = new Suite.ConsoleRenderer();
        def = def || {};
        for (p in defaults) {
            def[p] = def[p] || defaults[p];
        }
        return def;
    };    

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


    Suite.DomRenderer = function DomRenderer(container, doc) {
        Suite.ConsoleRenderer.call(this);   // Extends ConsoleRenderer
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

    Suite.configure = function(options) {
        for (p in options) {
            defaults[p] = options[p];
        }
    };

    Suite.getConfiguration = function() {
        var c = {};
        for (p in defaults) {
            c[p] = defaults[p];
        }
        return c;
    };

    function getOptions(options) {
        options = options || {};
        for (p in defaults) {
            if (!(p in options)) {
                options[p] = defaults[p];
            }
        }
        return options;
    };

    var defaults = {
        renderer: new Suite.ConsoleRenderer(console)
    };

    return Suite;
}());