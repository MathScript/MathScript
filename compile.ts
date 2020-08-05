import * as ts from "typescript"
import { rewriteNode, rewriteChildren } from "./visit";


function compile(fileNames: string[], options: ts.CompilerOptions): void
{
  let program = ts.createProgram(fileNames, options)

  for (let input of program.getSourceFiles())
  if (input.fileName.endsWith('.m.ts'))
    rewriteNode(input, visitor)


  console.log("<PRE-EMIT>")
  logDiagnostics(ts.getPreEmitDiagnostics(program))

  let emitResult = program.emit()

  console.log("<POST-EMIT>")
  logDiagnostics(emitResult.diagnostics)

  let exitCode = emitResult.emitSkipped ? 1 : 0;
  console.log(`Process exiting with code '${exitCode}'.`)
  process.exit(exitCode)
}


const operatorNameMap: { [op in ts.SyntaxKind]?: string } = {
  [ts.SyntaxKind.PlusToken]: 'op_plus',
  [ts.SyntaxKind.MinusToken]: 'op_minus',
  [ts.SyntaxKind.AsteriskToken]: 'op_asterisk',
  [ts.SyntaxKind.SlashToken]: 'op_slash'
}

function visitor(node: ts.Node): ts.Node {
  if (node.kind === ts.SyntaxKind.BinaryExpression) {
    let expr = node as ts.BinaryExpression;
    const name = operatorNameMap[expr.operatorToken.kind]

    if (name !== undefined) {
      const identifier = ts.createIdentifier(name);
      return ts.createCall(identifier, undefined, [expr.left, expr.right]);
    }
  }

  return rewriteChildren(node, visitor);
}

function logDiagnostics(arr: readonly ts.Diagnostic[])
{
  for (let diagnostic of arr)
  {
      if (diagnostic.file)
      {
        let { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start!)
        let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")
        console.log(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`)
      }
      else
      {
        console.log(ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"))
      }
  }
}

compile(['sample.m.ts'], {
  target: ts.ScriptTarget.ES5,
  module: ts.ModuleKind.CommonJS
})
