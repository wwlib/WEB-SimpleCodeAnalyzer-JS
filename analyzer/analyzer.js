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
        
        if (requiredElementsResult == "") { // Proceed if no errors are reported parsing the JSON
            
            // Get the esprima AST for the users code
            var astResult = checkCode(editorTest.getValue());
            AstResultString = JSON.stringify(astResult, null, 2);
            
            if (AstResultString.indexOf("Error:") != 1) { // Proceed if esprima does not report an error
                
                // Show the esprima AST in editorAST and clear the selection
                editorAST.setValue(AstResultString, -1);

                // Check to see if required code elements are present
                updateRequiredElementStatus();
                updateResultMessages("Match: " + match, "");
            } else {
                // If there is a esprima error, clear/update the result messages
                match = false;
                updateResultMessages("Match: " + match, "Code Parse Error:<br>" + AstResultString);
            }
        } else {
            // If there is a JSON parsing error, clear/update the result messages
            match = false;
            updateResultMessages("Match: " + match, requiredElementsResult);
        }
    }
    
    function updateResultMessages(match_status, error_status) {
        $("#results").html(match_status);
        $(".match-fail-message").html(error_status);
    }
    
    function getRequiredElements() {
        var required = editorRequiredElements.getValue();
        var errorMessage;
        
        try {
            requiredElements = JSON.parse(required);
            errorMessage = "";
        } catch (error) {
            requiredElements = {"required": []};
            errorMessage = "Required Elements Definition Error:<br>" + error;
        }
        
        return errorMessage;
    }
    
    function updateRequiredElementStatus() {
        var elements = requiredElements.required;
        var textList = "<p>In your code you should:</p><ul>";
        var listLength = elements.length;
        
        for (var i=0; i < listLength; i++) {
            if (elements[i].OK) {
                textList += "<li>[OK] ";
            } else {
                textList += "<li>[  ] ";
            }
            textList += elements[i].description + "</li>";
        }
        
        textList += "</ul>";
        $("#required-elements-status").html(textList);
    }
    
    function checkRequiredElements(path) {
        var elements = requiredElements.required;
        var listLength = elements.length;
        
        match = true;
                
        for (var i=0; i < listLength; i++) {
            var element = elements[i];

            if (!element.OK) {
                var found = path.indexOf(element.pattern);
                
                if (found >= 0) {
                    element.OK = true;
                } else {
                    match = false;
                }
            }
        }
    }

    $(".ast-esprima-generate").click(function(evt) {
        var code = editorTest.getValue();
        var result = "";
        
        result = checkCode(code);
        
        editorAST.setValue(JSON.stringify(result, null, 2), -1);
    });
    
    function checkCode(code) {
        var result;
        
        try {
            result = esprima.parse(code);
            analyzeCode(code);
        }
        catch (error) {
            result = "" + error;
        }
        
        return result;
    }

    
    // Output results on the initial load.
    $("#run-button").click();


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
    
    // Based on: http://sevinf.github.io/blog/2012/09/29/esprima-tutorial/
    function traverse(node, path) {
        var result = "";
        
        for (var key in node) { //2
            if (node.hasOwnProperty(key)) { //3
                var child = node[key];
                if (!match && typeof child === 'object' && child !== null) { //4

                    if (Array.isArray(child)) {
                        child.forEach(function (node) { //5
                            result += traverse(node, path);
                        });
                    } else {
                        result += traverse(child, path);
                    }
                } else {
                    if (key == "type") {
                        path += "/" + child;
                        result += path + "\n"; // To avoid accumulating paths (save memory), set result to ""
                        checkRequiredElements(path);
                    }
                }
            }
        }

        return result;
    }
    
    function analyzeCode(code) {
        var ast = esprima.parse(code);
        var result = "";
        result = traverse(ast, "");
        
       editorElementPaths.setValue(result, -1);
    }
});