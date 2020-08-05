"use strict";
var _a;
exports.__esModule = true;
var ts = require("typescript");
var visit_1 = require("./visit");
function compile(fileNames, options) {
    var program = ts.createProgram(fileNames, options);
    for (var _i = 0, _a = program.getSourceFiles(); _i < _a.length; _i++) {
        var input = _a[_i];
        if (input.fileName.endsWith('.m.ts'))
            visit_1.rewriteNode(input, visitor);
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
var operatorNameMap = (_a = {},
    _a[ts.SyntaxKind.PlusToken] = 'op_plus',
    _a[ts.SyntaxKind.MinusToken] = 'op_minus',
    _a[ts.SyntaxKind.AsteriskToken] = 'op_asterisk',
    _a[ts.SyntaxKind.SlashToken] = 'op_slash',
    _a);
function visitor(node) {
    if (node.kind === ts.SyntaxKind.BinaryExpression) {
        var expr = node;
        var name_1 = operatorNameMap[expr.operatorToken.kind];
        if (name_1 !== undefined) {
            var identifier = ts.createIdentifier(name_1);
            return ts.createCall(identifier, undefined, [expr.left, expr.right]);
        }
    }
    return visit_1.rewriteChildren(node, visitor);
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
