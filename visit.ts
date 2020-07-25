import * as ts from "typescript"

export function visitChildren(node: ts.Node, visitor: ts.Visitor)
{
    for (const prop of possibleChildProperties)
    {
        if (node[prop] !== undefined)
        {
            if (Array.isArray(node[prop]))
                node[prop] = node[prop].map(visitor)
            else
                node[prop] = visitor(node[prop])
        }
    }

    return node
}

const possibleChildProperties = <const>[
    'typeArguments', 'left', 'right', 'expression', 'name',
    'constraint', 'default', 'decorators',  'modifiers',
    'dotDotDotToken', 'questionToken', 'exclamationToken',
    'type', 'initializer', 'typeParameters', 'parameters',
    'declarations', 'asteriskToken', 'body', 'assertsModifier',
    'parameterName', 'typeName', 'exprName', 'members',
    'heritageClauses', 'elementType', 'elements', 'literal',
    'declarationList', 'types', 'checkType', 'extendsType',
    'trueType', 'falseType', 'typeParameter', 'argument',
    'qualifier', 'objectType', 'indexType', 'readonlyToken',
    'propertyName', 'properties', 'questionDotToken',
    'argumentExpression', 'arguments', 'tag', 'template',
    'equalsGreaterThanToken', 'operand', 'operatorToken',
    'condition', 'whenTrue', 'colonToken', 'whenFalse',
    'head', 'templateSpans', 'statements', 'thenStatement',
    'elseStatement', 'statement', 'incrementor', 'awaitModifier',
    'label', 'caseBlock', 'tryBlock', 'catchClause', 'finallyBlock',
    'clauses', 'moduleReference', 'importClause', 'moduleSpecifier',
    'namedBindings', 'exportClause', 'openingElement',
    'children', 'closingElement', 'tagName', 'attributes',
    'openingFragment', 'closingFragment', 'variableDeclaration',
    'block', 'objectAssignmentInitializer'
]
