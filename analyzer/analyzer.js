/* Simple code analyzer that verifies the presence of required programming elements

*/

$(document).ready(function() {
    // Set up the editors (disable workers so we can run locally as well.)
    var editorRequiredElements = ace.edit("required-elements");
    setupEditor(editorRequiredElements);
    var editorTest = ace.edit("test-code");
    setupEditor(editorTest);
    var editorAST = ace.edit("ast-esprima");
    setupEditor(editorAST);
    var editorElementPaths = ace.edit("code-element-paths");
    setupEditor(editorElementPaths);
    var oldFocus = editorRequiredElements;
    
    var requiredElements = {"required": []}; // A JSON object defining elements that should be included in the code
    var match = false; // A flag that indicates when all required elements are present in the code

    // Analyze the user's code when the user presses the button.
    $("#run-button").click(function(evt) {
        
        runAnalyzer();
        
        oldFocus.focus();
    });
    
    // Analyze the user's code whenever it changes
    editorTest.getSession().on('change', runAnalyzer);
    
    // The main code analysis routine
    function runAnalyzer() {
        
        // Clear all status messages
        updateResultMessages("Working", "");
        $("#required-elements-status").html("");
        editorAST.setValue("");
        editorElementPaths.setValue("");
        
        // Parse the required elements JSON from the editorRequiredElements editor
        var requiredElementsResult = getRequiredElements();
        
        if (requiredElementsResult.OK) { // Proceed if no errors are reported parsing the JSON
            requiredElements = requiredElementsResult.data;
            
            // Get the esprima AST for the users code
            var code = editorTest.getValue();
            var astResult = checkCode(code);
            
            if (astResult.OK) { // Proceed if esprima does not report an error
                // Show the esprima AST in editorAST and clear the selection
                editorAST.setValue(JSON.stringify(astResult.data, null, 2), -1);
                
                analyzeCode(code);

                // Check to see if required code elements are present
                updateRequiredElementStatus();
                updateResultMessages("Match: " + match, "");
            } else {
                // If there is a esprima error, clear/update the result messages
                match = false;
                updateResultMessages("Match: " + match, "Code Parse Error:<br>" + astResult.error);
            }
        } else {
            // If there is a JSON parsing error, clear/update the result messages
            match = false;
            updateResultMessages("Match: " + match, requiredElementsResult.error);
        }
    }
    
    function updateResultMessages(match_status, error_status) {
        $("#results").html(match_status);
        $(".match-fail-message").html(error_status);
    }
    
    // Parse the JSON containing the definitions of required code elements
    function getRequiredElements() {
        var required = editorRequiredElements.getValue();
        var result = {"OK": true, "data": {"required": []}, "error": ""};
        
        try {
            result.data = JSON.parse(required);
        } catch (error) {
            result.OK = false;
            result.error = "Required Elements Definition Error:<br>" + error;
        }
        
        return result;
    }
    
    // Redraw the list of required code elements with status indicator [x]
    function updateRequiredElementStatus() {
        var elements = requiredElements.required;
        var textList = "<p>In your code you should:</p><ul>";
        var listLength = elements.length;
        
        match = true;
        
        for (var i=0; i < listLength; i++) {
            var element = elements[i];
            if ((element.OK && !element.exclude) || (!element.OK && element.exclude)) {
                textList += "<li>[x] ";
            } else {
                textList += "<li>[  ] ";
                match = false;
            }
            textList += elements[i].description + "</li>";
        }
        
        textList += "</ul>";
        $("#required-elements-status").html(textList);
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
        var elements = requiredElements.required;
        var listLength = elements.length;
                        
        for (var i=0; i < listLength; i++) {
            var element = elements[i];
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

    function setupEditor(editor) {
        editor.getSession().setUseWorker(false);
        editor.getSession().setMode("ace/mode/javascript");
        editor.renderer.setShowGutter(false);
        editor.renderer.setPadding(6);
        // Save the user's focus so we can restore it afterwards.
        editor.on("focus", function() {
            oldFocus = editor;
        });
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
        
       editorElementPaths.setValue(result, -1);
    }
    
    // Output results on the initial load.
    $("#run-button").click();
});