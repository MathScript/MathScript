import * as ts from "typescript"

function compile(fileNames: string[], options: ts.CompilerOptions): void
{
  let program = ts.createProgram(fileNames, options)

  console.log(program)

  console.log("<PRE-EMIT>")
  logDiagnostics(ts.getPreEmitDiagnostics(program))

  let emitResult = program.emit()

  console.log("<POST-EMIT>")
  logDiagnostics(emitResult.diagnostics)

  let exitCode = emitResult.emitSkipped ? 1 : 0;
  console.log(`Process exiting with code '${exitCode}'.`)
  process.exit(exitCode)
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

compile(['index.ts'], {
  target: ts.ScriptTarget.ES5,
  module: ts.ModuleKind.CommonJS
})
