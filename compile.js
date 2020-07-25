"use strict";
exports.__esModule = true;
var ts = require("typescript");
var visit_1 = require("./visit");
var noop = new Proxy(function () { return noop; }, { get: function () { return noop; } });
function compile(fileNames, options) {
    var program = ts.createProgram(fileNames, options);
    var inputFiles = program.getSourceFiles();
    var outputFiles = [];
    for (var _i = 0, inputFiles_1 = inputFiles; _i < inputFiles_1.length; _i++) {
        var input = inputFiles_1[_i];
        if (input.fileName.endsWith('.m.ts')) {
            var output = ts.visitNode(input, visitor);
            outputFiles.push(output);
        }
        else {
            outputFiles.push(input);
        }
    }
    console.log("<PRE-EMIT>");
    logDiagnostics(ts.getPreEmitDiagnostics(program));
    var emitResult = program.emit();
    console.log("<POST-EMIT>");
    logDiagnostics(emitResult.diagnostics);
    var exitCode = emitResult.emitSkipped ? 1 : 0;
    console.log("Process exiting with code '" + exitCode + "'.");
    process.exit(exitCode);
}
function visitor(node) {
    console.log("NODE: " + ts.SyntaxKind[node.kind]);
    if (node.kind === ts.SyntaxKind.BinaryExpression) {
        var expr = node;
        var fnName = void 0;
        switch (expr.operatorToken.kind) {
            case ts.SyntaxKind.PlusToken:
                fnName = 'op_plus';
                break;
            case ts.SyntaxKind.MinusToken:
                fnName = 'op_minus';
                break;
            case ts.SyntaxKind.AsteriskToken:
                fnName = 'op_asterisk';
                break;
            case ts.SyntaxKind.SlashToken:
                fnName = 'op_slash';
                break;
        }
        if (fnName !== undefined) {
            return ts.createCall(ts.createIdentifier(fnName), [], [expr.left, expr.right]);
        }
    }
    return visit_1.visitChildren(node, visitor);
}
function logDiagnostics(arr) {
    for (var _i = 0, arr_1 = arr; _i < arr_1.length; _i++) {
        var diagnostic = arr_1[_i];
        if (diagnostic.file) {
            var _a = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start), line = _a.line, character = _a.character;
            var message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
            console.log(diagnostic.file.fileName + " (" + (line + 1) + "," + (character + 1) + "): " + message);
        }
        else {
            console.log(ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
        }
    }
}
compile(['sample.m.ts'], {
    target: ts.ScriptTarget.ES5,
    module: ts.ModuleKind.CommonJS
});
