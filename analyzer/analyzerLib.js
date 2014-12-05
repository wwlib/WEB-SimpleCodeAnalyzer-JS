/*
 * AnalyzerLib encapsulates the methods of a Simple Code Analyzer
 * in order to enable basic unit testing
 *
 * Dependencies: esprima.js, underscore.js
 */
(function (global) {
    /* Detect npm versus browser usage */
    var exports;
    var esprima;
    var _;

    if (typeof module !== "undefined" && module.exports) {
        exports = module.exports = {};
        esprima = require("esprima");
        _ = require("underscore");
    } else {
        exports = this.AnalyzerLib = {};
        esprima = global.esprima;
        _ = global._;
    }

    if (!esprima || !_) {
        throw "Error: Both Esprima and UnderscoreJS are required dependencies.";
    }
    
    var requiredElements = []; // An array of elements that should be included in the code

    // Parse the JSON containing the definitions of required code elements
    function parseRequiredElements(required) {
        var result = {"OK": true, "error": ""};
        
        try {
            var requiredElementsJSON = JSON.parse(required);
            requiredElements = requiredElementsJSON.required;
        } catch (error) {
            requiredElements = [];
            result.OK = false;
            result.error = "Required Elements Definition Error:<br>" + error;
        }
        
        return result;
    }
    
    function getRequiredElements() {
        return requiredElements;
    }
    
    // Check to see if any rquirements are satisfied by the given element path/description
    // Each leaf of the AST is considered a testable element
    // The path to the leaf contains information about its context/structure
    // For example: A top level For Statement will have the path:
    //                  /Program/ForStatement
    //              A variable assignment in the body (block) of a For Statement will have the path:
    //                  /Program/ForStatement/BlockStatement/ExpressionStatement/AssignmentExpression
    //  This is a rudimentary way to check for program structure (a starting point, really)
    function checkRequiredElements(path) {
        var listLength = requiredElements.length;
                        
        for (var i=0; i < listLength; i++) {
            var element = requiredElements[i];
            var found = path.indexOf(element.pattern);

            if (found >= 0) {
                element.OK = true;
            }
        }
    }
    
    // Check the user's code by parsing it with Esprima to generate the AST
    function checkCode(code) {
        var result = {"OK": true, "data": {}, "error": ""};
        
        try {
            result.data = esprima.parse(code);
        }
        catch (error) {
            result.OK = false;
            result.error = "" + error;
        }
        
        return result;
    }

    // Reference: http://sevinf.github.io/blog/2012/09/29/esprima-tutorial/
    // Traverse the Esprima-generated AST and check each element path against the code requirements
    // Optional: accumulate a list of all the paths for debugging
    function traverse(node, path) {
        var result = "";

        for (var key in node) {
            if (node.hasOwnProperty(key)) {
                var child = node[key];
                if (typeof child === 'object' && child !== null) {

                    if (Array.isArray(child)) {
                        child.forEach(function (node) {
                            result += traverse(node, path);
                        });
                    } else {
                        result += traverse(child, path);
                    }
                } else { // When a leaf is reached, see if any code requirements have been satisfied
                    if (key == "type") {
                        path += "/" + child;
                        result += path + "\n"; // Optional: To avoid accumulating paths (save memory), set result to ""
                        checkRequiredElements(path);
                    }
                }
            }
        }

        return result;
    }

    // Initiate the traverse of the AST
    // Display the accumulated list of paths (if available)
    function analyzeCode(code) {
        var ast = esprima.parse(code);
        var result = "";
        result = traverse(ast, "");

        return result;
    }

    exports.analyzeCode = analyzeCode;
    exports.parseRequiredElements = parseRequiredElements;
    exports.getRequiredElements = getRequiredElements;
    exports.checkCode = checkCode;

})(typeof window !== "undefined" ? window : global);