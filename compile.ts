import * as ts from "typescript"
import { visitChildren } from "./visit";


const noop = new Proxy(() => noop, { get: () => noop })

function compile(fileNames: string[], options: ts.CompilerOptions): void
{
  let program = ts.createProgram(fileNames, options)

  let inputFiles = program.getSourceFiles()
  let outputFiles: ts.SourceFile[] = []


  for (let input of inputFiles)
  {
    if (input.fileName.endsWith('.m.ts'))
    {
      let output = ts.visitNode(input, visitor)
      outputFiles.push(output)
    }
    else
    {
      outputFiles.push(input)
    }
  }


  console.log("<PRE-EMIT>")
  logDiagnostics(ts.getPreEmitDiagnostics(program))

  let emitResult = program.emit()

  console.log("<POST-EMIT>")
  logDiagnostics(emitResult.diagnostics)

  let exitCode = emitResult.emitSkipped ? 1 : 0;
  console.log(`Process exiting with code '${exitCode}'.`)
  process.exit(exitCode)
}

function visitor(node: ts.Node): ts.Node
{
  console.log(`NODE: ${ts.SyntaxKind[node.kind]}`)
  if (node.kind === ts.SyntaxKind.BinaryExpression) {
    let expr = node as ts.BinaryExpression

    let fnName: string | undefined

    switch (expr.operatorToken.kind)
    {
      case ts.SyntaxKind.PlusToken:
        fnName = 'op_plus'
        break

      case ts.SyntaxKind.MinusToken:
        fnName = 'op_minus'
        break

      case ts.SyntaxKind.AsteriskToken:
        fnName = 'op_asterisk'
        break

      case ts.SyntaxKind.SlashToken:
        fnName = 'op_slash'
        break
    }

    if (fnName !== undefined)
    {
      return ts.createCall(ts.createIdentifier(fnName), [], [expr.left, expr.right])
    }
  }

  return visitChildren(node, visitor)
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
