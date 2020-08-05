import * as ts from "typescript"

export function rewriteNode(node: ts.Node, visitor: ts.Visitor): ts.Node
{
    const newNode = visitor(node)

    if (newNode === node)
        return node

    if (Array.isArray(newNode))
        throw new TypeError("Visitor returned an array – this isn't supported yet.")

    newNode.parent = node.parent;
    newNode.flags = node.flags;
    newNode.pos = node.pos;
    newNode.end = node.end;

    Object.getOwnPropertyNames(node).forEach(prop => {
        delete node[prop];
    });

    Object.getOwnPropertyNames(newNode).forEach(prop => {
        node[prop] = newNode[prop];
    });

    return node;
}

export function rewriteChildren(node: ts.Node, visitor: ts.Visitor)
{
    for (const prop of possibleChildProperties)
    {
        if (node[prop] !== undefined)
        {
            if (Array.isArray(node[prop]))
                node[prop].forEach(n => rewriteNode(n, visitor))
            else
                rewriteNode(node[prop], visitor)
        }
    }

    return node
}

export const possibleChildProperties = <const>[
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
