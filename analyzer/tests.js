/* QUnit tests for AnalyzerLib. */

AnalyzerLib = this.AnalyzerLib;


var basicTests = function() {

    QUnit.module("Basic detection");

    test("Tests are working", function() {
        ok(true, "True is true");

        equal(false,
            false,
            "False is false");
    });
    
    
    test("Requirements JSON is parsed successfully", function() {
        var required = '{ "required": [ {"description": "Use a for statement", "pattern": "ForStatement"}]}';
        equal(AnalyzerLib.parseRequiredElements(required).OK,
            true,
            "result.OK = true");
        
        equal(AnalyzerLib.parseRequiredElements(required).error == "",
            true,
            "result.error is \"\"");
    });
    
    test("Mangled requirements JSON produces an appropriate result", function() {
        var required = '{ "required": [ "description": "Use a for statement", "pattern": "ForStatement"}]}';
        equal(AnalyzerLib.parseRequiredElements(required).OK,
            false,
            "result.OK = false");
        
        equal(AnalyzerLib.parseRequiredElements(required).error != "",
            true,
            "result.error is NOT \"\"");
        
    });
    
    test("Code is parsed successfully by Esprima", function() {
        var code = 'var x = 0;';
        equal(AnalyzerLib.checkCode(code).OK,
            true,
            "result.OK = true");
        
        equal(AnalyzerLib.checkCode(code).error == "",
            true,
            "result.error is \"\"");
        
    });
    
    test("Mangled code produces an appropriate result", function() {
        var code = '}var x = 0;';
        equal(AnalyzerLib.checkCode(code).OK,
            false,
            "result.OK = false");
        
        equal(AnalyzerLib.checkCode(code).error != "",
            true,
            "result.error is NOT \"\"");
        
    });
    
    test("AST is parsed successfully by Analyzer", function() {
        var ast = {"type": "Program","body": []};
        equal(AnalyzerLib.analyzeAST(ast).OK,
            true,
            "result.OK = true");
        
        equal(AnalyzerLib.analyzeAST(ast).error == "",
            true,
            "result.error is \"\"");
        
    });
};

var runAll = function() {
    basicTests();
};

runAll();
