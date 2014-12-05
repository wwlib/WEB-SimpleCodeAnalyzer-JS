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
        var requiredElementsResult = AnalyzerLib.parseRequiredElements(editorRequiredElements.getValue());
        
        if (requiredElementsResult.OK) { // Proceed if no errors are reported parsing the JSON
            
            // Get the esprima AST for the users code
            var code = editorTest.getValue();
            var astResult = AnalyzerLib.checkCode(code);
            
            if (astResult.OK) { // Proceed if esprima does not report an error
                // Show the esprima AST in editorAST and clear the selection
                editorAST.setValue(JSON.stringify(astResult.data, null, 2), -1);
                
                var analyzeResult = AnalyzerLib.analyzeAST(astResult.data);
                
                if (analyzeResult.OK) {
                    editorElementPaths.setValue(analyzeResult.data, -1);

                    // Check to see if required code elements are present
                    updateRequiredElementStatus(AnalyzerLib.getRequiredElements());
                    updateResultMessages("Match: " + match, "");
                } else {
                    match = false;
                    updateResultMessages("Match: " + match, "AST Parse Error:<br>" + analyzeResult.error);
                }
            } else {
                // If there is an esprima error, clear/update the result messages
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
    
    // Redraw the list of required code elements with status indicator [x]
    function updateRequiredElementStatus(elements) {
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
    
    
    // Output results on the initial load.
    $("#run-button").click();
});