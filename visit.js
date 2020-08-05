"use strict";
exports.__esModule = true;
exports.possibleChildProperties = exports.rewriteChildren = exports.rewriteNode = void 0;
function rewriteNode(node, visitor) {
    var newNode = visitor(node);
    if (newNode === node)
        return node;
    if (Array.isArray(newNode))
        throw new TypeError("Visitor returned an array – this isn't supported yet.");
    newNode.parent = node.parent;
    newNode.flags = node.flags;
    newNode.pos = node.pos;
    newNode.end = node.end;
    Object.getOwnPropertyNames(node).forEach(function (prop) {
        delete node[prop];
    });
    Object.getOwnPropertyNames(newNode).forEach(function (prop) {
        node[prop] = newNode[prop];
    });
    return node;
}
exports.rewriteNode = rewriteNode;
function rewriteChildren(node, visitor) {
    for (var _i = 0, possibleChildProperties_1 = exports.possibleChildProperties; _i < possibleChildProperties_1.length; _i++) {
        var prop = possibleChildProperties_1[_i];
        if (node[prop] !== undefined) {
            if (Array.isArray(node[prop]))
                node[prop].forEach(function (n) { return rewriteNode(n, visitor); });
            else
                rewriteNode(node[prop], visitor);
        }
    }
    return node;
}
exports.rewriteChildren = rewriteChildren;
exports.possibleChildProperties = [
    'typeArguments', 'left', 'right', 'expression', 'name',
    'constraint', 'default', 'decorators', 'modifiers',
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
];
