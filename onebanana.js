function OneBanana(options) {

    function Asserts(test) {
        var self = this;
        var callChecks = [];
        this.ok = function(bool, msg) {
            bool ? test.pass(msg) : test.fail(msg);
        };
        this.fail = function(msg) {
            test.fail(msg);
        };
        this.mustCall = function(obj, funcName, times) {
            times = (arguments.length > 2) ? times : 1;
            var count = 0;
            callChecks.push(function() {
                if (count != times) {
                    test.fail("Function " + p + " was called " + count + " times, not " + times);
                }
                else {
                    test.pass("Function " + p + " was called " + count + " times.");
                }
            });
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
    }

    function Test(name, f, renderer) {
        var self = this;
        
        this.name = name;
        this.passed = 0;
        this.failed = 0;
        this.run = function() {
            try {
                reset();
                var a = new Asserts(self);
                renderer.testStart(self);
                try { f(a) }
                catch (e) {
                    self.fail(e);
                }
                a.checkCalled();
            }
            catch (e) {
                self.fail("ERROR IN MONKEYTEST FRAMEWORK: " + e);
            }
            finally {
                renderer.testDone(self);
            }
        }
        this.pass = function(msg) {
            renderer.assertPassed(msg || "ok");
            self.passed++;
        };
        this.fail = function(msg) {
            renderer.assertFailed(msg || "ok");
            self.failed++;
        };

        function reset() {
            self.passed = 0;
            self.failed = 0;
        }
    }

    this.runAsync = function(k) {
        try {
            reset();
            var a = new Asserts(self);
            renderer.testStart(self);
            try {
                f(a, k);
            }
            catch (e) {
                self.fail(e);
            }
    };

    function Renderer(def) {
        var defaults = new ConsoleRenderer();
        def = def || {};
        for (p in defaults) {
            def[p] = def[p] || defaults[p];
        }
        return def;
    };    

    var self = this;
    var tests = [];
    this.name = options.name;
    this.passed = 0;
    this.failed = 0;
    this.renderer = new Renderer(options.renderer);
    this.asynchronous = false;
    this.testAsync = fucntion() {
        self.asynchronous = true;
        self.test.apply(self, arguments);
    };        
    this.test = function() {
        for (var i = 0; i < arguments.length; i++) {
            var f = arguments[i];
            var t = new Test(f.name, f, self.renderer);
            tests.push(t);
        }
        self.run()
    };
    this.run = function() {
        self.asynchronous ? runAsynchronous() : runSynchronous();
    };

    function runAsynchronous() {
        reset();
        self.renderer.suiteStart(self);
        function next(tests, k) {
            if (tests.length) {
                var t = tests.shift();
                t.run(function() {
                    next(tests, k);
                });
            }
            else {
                k();
            }
        }
        function done() {
            self.renderer.suiteDone(self);
        }
        next();
    }

    function runSynchronous() {
        reset();
        self.renderer.suiteStart(self);
        for (var i = 0; i < tests.length; i++) {
            var t = tests[i];
            t.run();
            this.passed += t.passed;
            this.failed += t.failed;
        }
        self.renderer.suiteDone(self);
        return this.failed;
    }

    function reset() {
        self.passed = 0;
        self.failed = 0;
    }
}

function ConsoleRenderer() {
    this.log = function(msg) {
        console.log("    " + msg);
    },
    this.assertPassed = function(msg) {
        console.log("    " + msg);
    },
    this.assertFailed = function(msg) {
        console.log("  * FAILED: " + msg);
    },
    this.testError = function(msg) {
        console.log("    " + msg);
    },
    this.testStart = function(test) {
        console.log(test.name + ":");
    },
    this.testDone = function (test) {
        var status = "(p: " + test.passed + ", f: " + test.failed + ")";
        console.log("    " + (test.failed ? "FAILED" : "PASSED") + " " + status);
    },
    this.suiteStart = function(suite) {
        console.log("Suite: " + suite.name);
    },
    this.suiteDone = function(suite) {
        console.log("Finished Suite: " + suite.name);
        console.log("    asserts passed: " + suite.passed);
        console.log("    asserts failed: " + suite.failed);
        console.log("SUITE " + ((suite.failed) ? "FAILED" : "PASSED"));
    };
}

function DomRenderer(container) {
    ConsoleRenderer.call(this);             // Extends ConsoleRenderer
    container = getContainer(container);
    this.suiteStart = function(suite) {
        container.innerHTML = "";
        var title = document.createElement("h1");
        title.appendChild(document.createTextNode(suite.name));
        var link = buildReRunLink(function() {
            reset();
            suite.run();
        });
        title.appendChild(document.createTextNode(" "));
        title.appendChild(link);
        container.appendChild(title);
    };

    this.suiteDone = function(suite) {
        var div = document.createElement("div");
        div.appendChild(document.createTextNode(
            "SUITE " + ((suite.failed) ? "FAILED" : "PASSED") +
                " (p: " + suite.passed + ", f: " + suite.failed +")"
        ));
        container.appendChild(div);
    };

    this.testStart = function(test) {
        var title = document.createElement("h2");
        title.appendChild(document.createTextNode(test.name));
        title.appendChild(document.createTextNode(" "));
        var link = buildReRunLink(function() {
            reset();
            test.run();
        });
        title.appendChild(link);
        container.appendChild(title);
    };

    this.assertPassed = function(msg) {
        var div = document.createElement("div");
        div.appendChild(document.createTextNode(msg));
        container.appendChild(div);
    };

    this.assertFailed = function(msg) {
        var div = document.createElement("div");
        div.appendChild(document.createTextNode("FAILED: " + msg));
        container.appendChild(div);
    };

    this.testDone = function(test) {
        var div = document.createElement("div");
        var status = test.name
            + ": " + (test.failed ? "FAILED" : "PASSED")
            + " (p: " + test.passed + ", f: " + test.failed + ")";
        div.appendChild(document.createTextNode(status));
        container.appendChild(div);
        
    };

    function reset() {
        container.innerHTML = "";
    }

    function buildReRunLink(f) {
        var link = document.createElement("a");
        link.appendChild(document.createTextNode("(re-run)"));
        link.addEventListener("click", f);
        return link;
    }

    function getContainer(x) {
        switch (typeof x) {
        case "string":
            return document.getElementById(x);
            break;
        case "undefined":
            return document.getElementById("monkeytest");
        default:
            return x;
        }
    }
}    
