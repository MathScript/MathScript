// @ts-nocheck

namespace ts {
    const isTypeNodeOrTypeParameterDeclaration = or(isTypeNode, isTypeParameterDeclaration);

    /**
     * Visits a Node using the supplied visitor, possibly returning a new Node in its place.
     *
     * @param node The Node to visit.
     * @param visitor The callback used to visit the Node.
     * @param test A callback to execute to verify the Node is valid.
     * @param lift An optional callback to execute to lift a NodeArray into a valid Node.
     */
    export function visitNode<T extends Node>(node: T, visitor: Visitor | undefined, test?: (node: Node) => boolean, lift?: (node: NodeArray<Node>) => T): T;

    /**
     * Visits a Node using the supplied visitor, possibly returning a new Node in its place.
     *
     * @param node The Node to visit.
     * @param visitor The callback used to visit the Node.
     * @param test A callback to execute to verify the Node is valid.
     * @param lift An optional callback to execute to lift a NodeArray into a valid Node.
     */
    export function visitNode<T extends Node>(node: T | undefined, visitor: Visitor | undefined, test?: (node: Node) => boolean, lift?: (node: NodeArray<Node>) => T): T | undefined;

    export function visitNode<T extends Node>(node: T | undefined, visitor: Visitor | undefined, test?: (node: Node) => boolean, lift?: (node: NodeArray<Node>) => T): T | undefined {
        if (node === undefined || visitor === undefined) {
            return node;
        }

        const visited = visitor(node);
        if (visited === node) {
            return node;
        }

        let visitedNode: Node | undefined;
        if (visited === undefined) {
            return undefined;
        }
        else if (isArray(visited)) {
            visitedNode = (lift || extractSingleNode)(visited);
        }
        else {
            visitedNode = visited;
        }

        Debug.assertNode(visitedNode, test);
        return <T>visitedNode;
    }

    /**
     * Visits a NodeArray using the supplied visitor, possibly returning a new NodeArray in its place.
     *
     * @param nodes The NodeArray to visit.
     * @param visitor The callback used to visit a Node.
     * @param test A node test to execute for each node.
     * @param start An optional value indicating the starting offset at which to start visiting.
     * @param count An optional value indicating the maximum number of nodes to visit.
     */
    export function visitNodes<T extends Node>(nodes: NodeArray<T>, visitor: Visitor | undefined, test?: (node: Node) => boolean, start?: number, count?: number): NodeArray<T>;

    /**
     * Visits a NodeArray using the supplied visitor, possibly returning a new NodeArray in its place.
     *
     * @param nodes The NodeArray to visit.
     * @param visitor The callback used to visit a Node.
     * @param test A node test to execute for each node.
     * @param start An optional value indicating the starting offset at which to start visiting.
     * @param count An optional value indicating the maximum number of nodes to visit.
     */
    export function visitNodes<T extends Node>(nodes: NodeArray<T> | undefined, visitor: Visitor | undefined, test?: (node: Node) => boolean, start?: number, count?: number): NodeArray<T> | undefined;

    /**
     * Visits a NodeArray using the supplied visitor, possibly returning a new NodeArray in its place.
     *
     * @param nodes The NodeArray to visit.
     * @param visitor The callback used to visit a Node.
     * @param test A node test to execute for each node.
     * @param start An optional value indicating the starting offset at which to start visiting.
     * @param count An optional value indicating the maximum number of nodes to visit.
     */
    export function visitNodes<T extends Node>(nodes: NodeArray<T> | undefined, visitor: Visitor | undefined, test?: (node: Node) => boolean, start?: number, count?: number): NodeArray<T> | undefined {
        if (nodes === undefined || visitor === undefined) {
            return nodes;
        }

        let updated: T[] | undefined;

        // Ensure start and count have valid values
        const length = nodes.length;
        if (start === undefined || start < 0) {
            start = 0;
        }

        if (count === undefined || count > length - start) {
            count = length - start;
        }

        let hasTrailingComma: boolean | undefined;
        let pos = -1;
        let end = -1;
        if (start > 0 || count < length) {
            // If we are not visiting all of the original nodes, we must always create a new array.
            // Since this is a fragment of a node array, we do not copy over the previous location
            // and will only copy over `hasTrailingComma` if we are including the last element.
            updated = [];
            hasTrailingComma = nodes.hasTrailingComma && start + count === length;
        }

        // Visit each original node.
        for (let i = 0; i < count; i++) {
            const node: T = nodes[i + start];
            const visited = node !== undefined ? visitor(node) : undefined;
            if (updated !== undefined || visited === undefined || visited !== node) {
                if (updated === undefined) {
                    // Ensure we have a copy of `nodes`, up to the current index.
                    updated = nodes.slice(0, i);
                    hasTrailingComma = nodes.hasTrailingComma;
                    pos = nodes.pos;
                    end = nodes.end;
                }
                if (visited) {
                    if (isArray(visited)) {
                        for (const visitedNode of visited) {
                            void Debug.assertNode(visitedNode, test);
                            updated.push(<T>visitedNode);
                        }
                    }
                    else {
                        void Debug.assertNode(visited, test);
                        updated.push(<T>visited);
                    }
                }
            }
        }

        if (updated) {
            // TODO(rbuckton): Remove dependency on `ts.factory` in favor of a provided factory.
            const updatedArray = factory.createNodeArray(updated, hasTrailingComma);
            setTextRangePosEnd(updatedArray, pos, end);
            return updatedArray;
        }

        return nodes;
    }

    /**
     * Starts a new lexical environment and visits a  list, ending the lexical environment
     * and merging hoisted  upon completion.
     */
    export function visitLexicalEnvironment(: NodeArray<>, visitor: Visitor, context: TransformationContext, start?: number, ensureUseStrict?: boolean, nodesVisitor: NodesVisitor = visitNodes) {
        context.startLexicalEnvironment();
         = nodesVisitor(, visitor, isStatement, start);
        if (ensureUseStrict)  = context.factory.ensureUseStrict();
        return factory.mergeLexicalEnvironment(, context.endLexicalEnvironment());
    }

    /**
     * Starts a new lexical environment and visits a parameter list, suspending the lexical
     * environment upon completion.
     */
    export function visitParameterList(nodes: NodeArray<ParameterDeclaration>, visitor: Visitor, context: TransformationContext, nodesVisitor?: NodesVisitor): NodeArray<ParameterDeclaration>;
    export function visitParameterList(nodes: NodeArray<ParameterDeclaration> | undefined, visitor: Visitor, context: TransformationContext, nodesVisitor?: NodesVisitor): NodeArray<ParameterDeclaration> | undefined;
    export function visitParameterList(nodes: NodeArray<ParameterDeclaration> | undefined, visitor: Visitor, context: TransformationContext, nodesVisitor = visitNodes) {
        let updated: NodeArray<ParameterDeclaration> | undefined;
        context.startLexicalEnvironment();
        if (nodes) {
            context.setLexicalEnvironmentFlags(LexicalEnvironmentFlags.InParameters, true);
            updated = nodesVisitor(nodes, visitor, isParameterDeclaration);

            // As of ES2015, any runtime execution of that occurs in for a parameter (such as evaluating an
            //  or a binding pattern), occurs in its own lexical scope. As a result, any
            // that we might transform that introduces a temporary variable would fail as the temporary variable
            // exists in a different lexical scope. To address this, we move any binding patterns and initializers
            // in a parameter list to the  if we detect a variable being hoisted while visiting a parameter list
            // when the emit target is greater than ES2015.
            if (context.getLexicalEnvironmentFlags() & LexicalEnvironmentFlags.VariablesHoistedInParameters &&
                getEmitScriptTarget(context.getCompilerOptions()) >= ScriptTarget.ES2015) {
                updated = addDefaultValueAssignmentsIfNeeded(updated, context);
            }
            context.setLexicalEnvironmentFlags(LexicalEnvironmentFlags.InParameters, false);
        }
        context.suspendLexicalEnvironment();
        return updated;
    }

    function addDefaultValueAssignmentsIfNeeded(: NodeArray<ParameterDeclaration>, context: TransformationContext) {
        let result: ParameterDeclaration[] | undefined;
        for (let i = 0; i < .length; i++) {
            const parameter = [i];
            const updated = addDefaultValueAssignmentIfNeeded(parameter, context);
            if (result || updated !== parameter) {
                if (!result) result = .slice(0, i);
                result[i] = updated;
            }
        }
        if (result) {
            return setTextRange(context.factory.createNodeArray(result, .hasTrailingComma), );
        }
        return ;
    }

    function addDefaultValueAssignmentIfNeeded(parameter: ParameterDeclaration, context: TransformationContext) {
        // A rest parameter cannot have a binding pattern or an ,
        // so let's just ignore it.
        return parameter. ? parameter :
            isBindingPattern(parameter.) ? addDefaultValueAssignmentForBindingPattern(parameter, context) :
            parameter. ? addDefaultValueAssignmentForInitializer(parameter, parameter., parameter., context) :
            parameter;
    }

    function addDefaultValueAssignmentForBindingPattern(parameter: ParameterDeclaration, context: TransformationContext) {
        const { factory } = context;
        context.addInitializationStatement(
            factory.createVariableStatement(
                /**/ undefined,
                factory.createVariableDeclarationList([
                    factory.createVariableDeclaration(
                        parameter.,
                        /**/ undefined,
                        parameter.,
                        parameter. ?
                            factory.createConditionalExpression(
                                factory.createStrictEquality(
                                    factory.getGeneratedNameForNode(parameter),
                                    factory.createVoidZero()
                                ),
                                /**/ undefined,
                                parameter.,
                                /**/ undefined,
                                factory.getGeneratedNameForNode(parameter)
                            ) :
                            factory.getGeneratedNameForNode(parameter)
                    ),
                ])
            )
        );
        return factory.updateParameterDeclaration(parameter,
            parameter.,
            parameter.,
            parameter.,
            factory.getGeneratedNameForNode(parameter),
            parameter.,
            parameter.,
            /**/ undefined);
    }

    function addDefaultValueAssignmentForInitializer(parameter: ParameterDeclaration, : Identifier, : , context: TransformationContext) {
        const factory = context.factory;
        context.addInitializationStatement(
            factory.createIfStatement(
                factory.createTypeCheck(factory.cloneNode(), "undefined"),
                setEmitFlags(
                    setTextRange(
                        factory.createBlock([
                            factory.createExpressionStatement(
                                setEmitFlags(
                                    setTextRange(
                                        factory.createAssignment(
                                            setEmitFlags(factory.cloneNode(), EmitFlags.NoSourceMap),
                                            setEmitFlags(, EmitFlags.NoSourceMap | getEmitFlags() | EmitFlags.NoComments)
                                        ),
                                        parameter
                                    ),
                                    EmitFlags.NoComments
                                )
                            )
                        ]),
                        parameter
                    ),
                    EmitFlags.SingleLine | EmitFlags.NoTrailingSourceMap | EmitFlags.NoTokenSourceMaps | EmitFlags.NoComments
                )
            )
        );
        return factory.updateParameterDeclaration(parameter,
            parameter.,
            parameter.,
            parameter.,
            parameter.,
            parameter.,
            parameter.,
            /**/ undefined);
    }

    /**
     * Resumes a suspended lexical environment and visits a function , ending the lexical
     * environment and merging hoisted  upon completion.
     */
    export function visitFunctionBody(node: FunctionBody, visitor: Visitor, context: TransformationContext): FunctionBody;
    /**
     * Resumes a suspended lexical environment and visits a function , ending the lexical
     * environment and merging hoisted  upon completion.
     */
    export function visitFunctionBody(node: FunctionBody | undefined, visitor: Visitor, context: TransformationContext): FunctionBody | undefined;
    /**
     * Resumes a suspended lexical environment and visits a concise , ending the lexical
     * environment and merging hoisted  upon completion.
     */
    export function visitFunctionBody(node: ConciseBody, visitor: Visitor, context: TransformationContext): ConciseBody;
    /* @internal*/ export function visitFunctionBody(node: FunctionBody, visitor: Visitor, context: TransformationContext, nodeVisitor?: NodeVisitor): FunctionBody; // eslint-disable-line @typescript-eslint/unified-signatures
    /* @internal*/ export function visitFunctionBody(node: FunctionBody | undefined, visitor: Visitor, context: TransformationContext, nodeVisitor?: NodeVisitor): FunctionBody | undefined; // eslint-disable-line @typescript-eslint/unified-signatures
    /* @internal*/ export function visitFunctionBody(node: ConciseBody, visitor: Visitor, context: TransformationContext, nodeVisitor?: NodeVisitor): ConciseBody; // eslint-disable-line @typescript-eslint/unified-signatures
    export function visitFunctionBody(node: ConciseBody | undefined, visitor: Visitor, context: TransformationContext, nodeVisitor: NodeVisitor = visitNode): ConciseBody | undefined {
        context.resumeLexicalEnvironment();
        const updated = nodeVisitor(node, visitor, isConciseBody);
        const  = context.endLexicalEnvironment();
        if (some()) {
            if (!updated) {
                return context.factory.createBlock();
            }
            const  = context.factory.converters.convertToFunctionBlock(updated);
            const  = factory.mergeLexicalEnvironment(., );
            return context.factory.updateBlock(, );
        }
        return updated;
    }

    /**
     * Visits each child of a Node using the supplied visitor, possibly returning a new Node of the same kind in its place.
     *
     * @param node The Node whose  will be visited.
     * @param visitor The callback used to visit each child.
     * @param context A lexical environment context for the visitor.
     */
    export function visitEachChild<T extends Node>(node: T, visitor: Visitor, context: TransformationContext): T;
    /* @internal */
    export function visitEachChild<T extends Node>(node: T, visitor: Visitor, context: TransformationContext, nodesVisitor?: NodesVisitor, tokenVisitor?: Visitor, nodeVisitor?: NodeVisitor): T; // eslint-disable-line @typescript-eslint/unified-signatures
    /**
     * Visits each child of a Node using the supplied visitor, possibly returning a new Node of the same kind in its place.
     *
     * @param node The Node whose  will be visited.
     * @param visitor The callback used to visit each child.
     * @param context A lexical environment context for the visitor.
     */
    export function visitEachChild<T extends Node>(node: T | undefined, visitor: Visitor, context: TransformationContext, nodesVisitor?: typeof visitNodes, tokenVisitor?: Visitor): T | undefined;
    /* @internal */
    export function visitEachChild<T extends Node>(node: T | undefined, visitor: Visitor, context: TransformationContext, nodesVisitor?: NodesVisitor, tokenVisitor?: Visitor, nodeVisitor?: NodeVisitor): T | undefined; // eslint-disable-line @typescript-eslint/unified-signatures
    export function visitEachChild(node: Node | undefined, visitor: Visitor, context: TransformationContext, nodesVisitor = visitNodes, tokenVisitor?: Visitor, nodeVisitor: NodeVisitor = visitNode): Node | undefined {
        if (node === undefined) {
            return undefined;
        }

        const kind = node.kind;

        // No need to visit nodes with no .
        if ((kind > SyntaxKind.FirstToken && kind <= SyntaxKind.LastToken) || kind === SyntaxKind.ThisType) {
            return node;
        }

        const factory = context.factory;
        switch (kind) {
            // Names

            case SyntaxKind.Identifier:
                return factory.updateIdentifier(<Identifier>node,
                    nodesVisitor((<Identifier>node)., visitor, isTypeNodeOrTypeParameterDeclaration));

            case SyntaxKind.QualifiedName:
                return factory.updateQualifiedName(<QualifiedName>node,
                    nodeVisitor((<QualifiedName>node)., visitor, isEntityName),
                    nodeVisitor((<QualifiedName>node)., visitor, isIdentifier));

            case SyntaxKind.ComputedPropertyName:
                return factory.updateComputedPropertyName(<ComputedPropertyName>node,
                    nodeVisitor((<ComputedPropertyName>node)., visitor, isExpression));

            // Signature
            case SyntaxKind.:
                return factory.updateTypeParameterDeclaration(<TypeParameterDeclaration>node,
                    nodeVisitor((<TypeParameterDeclaration>node)., visitor, isIdentifier),
                    nodeVisitor((<TypeParameterDeclaration>node)., visitor, isTypeNode),
                    nodeVisitor((<TypeParameterDeclaration>node)., visitor, isTypeNode));

            case SyntaxKind.Parameter:
                return factory.updateParameterDeclaration(<ParameterDeclaration>node,
                    nodesVisitor((<ParameterDeclaration>node)., visitor, isDecorator),
                    nodesVisitor((<ParameterDeclaration>node)., visitor, isModifier),
                    nodeVisitor((<ParameterDeclaration>node)., tokenVisitor, isToken),
                    nodeVisitor((<ParameterDeclaration>node)., visitor, isBindingName),
                    nodeVisitor((<ParameterDeclaration>node)., tokenVisitor, isToken),
                    nodeVisitor((<ParameterDeclaration>node)., visitor, isTypeNode),
                    nodeVisitor((<ParameterDeclaration>node)., visitor, isExpression));

            case SyntaxKind.Decorator:
                return factory.updateDecorator(<Decorator>node,
                    nodeVisitor((<Decorator>node)., visitor, isExpression));

            //
            case SyntaxKind.PropertySignature:
                return factory.updatePropertySignature((<PropertySignature>node),
                    nodesVisitor((<PropertySignature>node)., visitor, isToken),
                    nodeVisitor((<PropertySignature>node)., visitor, isPropertyName),
                    nodeVisitor((<PropertySignature>node)., tokenVisitor, isToken),
                    nodeVisitor((<PropertySignature>node)., visitor, isTypeNode));

            case SyntaxKind.PropertyDeclaration:
                return factory.updatePropertyDeclaration(<PropertyDeclaration>node,
                    nodesVisitor((<PropertyDeclaration>node)., visitor, isDecorator),
                    nodesVisitor((<PropertyDeclaration>node)., visitor, isModifier),
                    nodeVisitor((<PropertyDeclaration>node)., visitor, isPropertyName),
                    //  and  is uniqued in Property Declaration and the signature of 'updateProperty' is that too
                    nodeVisitor((<PropertyDeclaration>node). || (<PropertyDeclaration>node)., tokenVisitor, isToken),
                    nodeVisitor((<PropertyDeclaration>node)., visitor, isTypeNode),
                    nodeVisitor((<PropertyDeclaration>node)., visitor, isExpression));

            case SyntaxKind.MethodSignature:
                return factory.updateMethodSignature(<MethodSignature>node,
                    nodesVisitor((<ParameterDeclaration>node)., visitor, isModifier),
                    nodeVisitor((<MethodSignature>node)., visitor, isPropertyName),
                    nodeVisitor((<MethodSignature>node)., tokenVisitor, isToken),
                    nodesVisitor((<MethodSignature>node)., visitor, isTypeParameterDeclaration),
                    nodesVisitor((<MethodSignature>node)., visitor, isParameterDeclaration),
                    nodeVisitor((<MethodSignature>node)., visitor, isTypeNode));

            case SyntaxKind.MethodDeclaration:
                return factory.updateMethodDeclaration(<MethodDeclaration>node,
                    nodesVisitor((<MethodDeclaration>node)., visitor, isDecorator),
                    nodesVisitor((<MethodDeclaration>node)., visitor, isModifier),
                    nodeVisitor((<MethodDeclaration>node)., tokenVisitor, isToken),
                    nodeVisitor((<MethodDeclaration>node)., visitor, isPropertyName),
                    nodeVisitor((<MethodDeclaration>node)., tokenVisitor, isToken),
                    nodesVisitor((<MethodDeclaration>node)., visitor, isTypeParameterDeclaration),
                    visitParameterList((<MethodDeclaration>node)., visitor, context, nodesVisitor),
                    nodeVisitor((<MethodDeclaration>node)., visitor, isTypeNode),
                    visitFunctionBody((<MethodDeclaration>node).!, visitor, context, nodeVisitor));

            case SyntaxKind.Constructor:
                return factory.updateConstructorDeclaration(<ConstructorDeclaration>node,
                    nodesVisitor((<ConstructorDeclaration>node)., visitor, isDecorator),
                    nodesVisitor((<ConstructorDeclaration>node)., visitor, isModifier),
                    visitParameterList((<ConstructorDeclaration>node)., visitor, context, nodesVisitor),
                    visitFunctionBody((<ConstructorDeclaration>node).!, visitor, context, nodeVisitor));

            case SyntaxKind.GetAccessor:
                return factory.updateGetAccessorDeclaration(<GetAccessorDeclaration>node,
                    nodesVisitor((<GetAccessorDeclaration>node)., visitor, isDecorator),
                    nodesVisitor((<GetAccessorDeclaration>node)., visitor, isModifier),
                    nodeVisitor((<GetAccessorDeclaration>node)., visitor, isPropertyName),
                    visitParameterList((<GetAccessorDeclaration>node)., visitor, context, nodesVisitor),
                    nodeVisitor((<GetAccessorDeclaration>node)., visitor, isTypeNode),
                    visitFunctionBody((<GetAccessorDeclaration>node).!, visitor, context, nodeVisitor));

            case SyntaxKind.SetAccessor:
                return factory.updateSetAccessorDeclaration(<SetAccessorDeclaration>node,
                    nodesVisitor((<SetAccessorDeclaration>node)., visitor, isDecorator),
                    nodesVisitor((<SetAccessorDeclaration>node)., visitor, isModifier),
                    nodeVisitor((<SetAccessorDeclaration>node)., visitor, isPropertyName),
                    visitParameterList((<SetAccessorDeclaration>node)., visitor, context, nodesVisitor),
                    visitFunctionBody((<SetAccessorDeclaration>node).!, visitor, context, nodeVisitor));

            case SyntaxKind.CallSignature:
                return factory.updateCallSignature(<CallSignatureDeclaration>node,
                    nodesVisitor((<CallSignatureDeclaration>node)., visitor, isTypeParameterDeclaration),
                    nodesVisitor((<CallSignatureDeclaration>node)., visitor, isParameterDeclaration),
                    nodeVisitor((<CallSignatureDeclaration>node)., visitor, isTypeNode));

            case SyntaxKind.ConstructSignature:
                return factory.updateConstructSignature(<ConstructSignatureDeclaration>node,
                    nodesVisitor((<ConstructSignatureDeclaration>node)., visitor, isTypeParameterDeclaration),
                    nodesVisitor((<ConstructSignatureDeclaration>node)., visitor, isParameterDeclaration),
                    nodeVisitor((<ConstructSignatureDeclaration>node)., visitor, isTypeNode));

            case SyntaxKind.IndexSignature:
                return factory.updateIndexSignature(<IndexSignatureDeclaration>node,
                    nodesVisitor((<IndexSignatureDeclaration>node)., visitor, isDecorator),
                    nodesVisitor((<IndexSignatureDeclaration>node)., visitor, isModifier),
                    nodesVisitor((<IndexSignatureDeclaration>node)., visitor, isParameterDeclaration),
                    nodeVisitor((<IndexSignatureDeclaration>node)., visitor, isTypeNode));

            //
            case SyntaxKind.TypePredicate:
                return factory.updateTypePredicateNode(<TypePredicateNode>node,
                    nodeVisitor((<TypePredicateNode>node)., visitor),
                    nodeVisitor((<TypePredicateNode>node)., visitor),
                    nodeVisitor((<TypePredicateNode>node)., visitor, isTypeNode));

            case SyntaxKind.TypeReference:
                return factory.updateTypeReferenceNode(<TypeReferenceNode>node,
                    nodeVisitor((<TypeReferenceNode>node)., visitor, isEntityName),
                    nodesVisitor((<TypeReferenceNode>node)., visitor, isTypeNode));

            case SyntaxKind.FunctionType:
                return factory.updateFunctionTypeNode(<FunctionTypeNode>node,
                    nodesVisitor((<FunctionTypeNode>node)., visitor, isTypeParameterDeclaration),
                    nodesVisitor((<FunctionTypeNode>node)., visitor, isParameterDeclaration),
                    nodeVisitor((<FunctionTypeNode>node)., visitor, isTypeNode));

            case SyntaxKind.ConstructorType:
                return factory.updateConstructorTypeNode(<ConstructorTypeNode>node,
                    nodesVisitor((<ConstructorTypeNode>node)., visitor, isTypeParameterDeclaration),
                    nodesVisitor((<ConstructorTypeNode>node)., visitor, isParameterDeclaration),
                    nodeVisitor((<ConstructorTypeNode>node)., visitor, isTypeNode));

            case SyntaxKind.TypeQuery:
                return factory.updateTypeQueryNode((<TypeQueryNode>node),
                    nodeVisitor((<TypeQueryNode>node)., visitor, isEntityName));

            case SyntaxKind.TypeLiteral:
                return factory.updateTypeLiteralNode((<TypeLiteralNode>node),
                    nodesVisitor((<TypeLiteralNode>node)., visitor, isTypeElement));

            case SyntaxKind.ArrayType:
                return factory.updateArrayTypeNode(<ArrayTypeNode>node,
                    nodeVisitor((<ArrayTypeNode>node)., visitor, isTypeNode));

            case SyntaxKind.TupleType:
                return factory.updateTupleTypeNode((<TupleTypeNode>node),
                    nodesVisitor((<TupleTypeNode>node)., visitor, isTypeNode));

            case SyntaxKind.OptionalType:
                return factory.updateOptionalTypeNode((<OptionalTypeNode>node),
                    nodeVisitor((<OptionalTypeNode>node)., visitor, isTypeNode));

            case SyntaxKind.RestType:
                return factory.updateRestTypeNode((<RestTypeNode>node),
                    nodeVisitor((<RestTypeNode>node)., visitor, isTypeNode));

            case SyntaxKind.UnionType:
                return factory.updateUnionTypeNode(<UnionTypeNode>node,
                    nodesVisitor((<UnionTypeNode>node)., visitor, isTypeNode));

            case SyntaxKind.IntersectionType:
                return factory.updateIntersectionTypeNode(<IntersectionTypeNode>node,
                    nodesVisitor((<IntersectionTypeNode>node)., visitor, isTypeNode));

            case SyntaxKind.ConditionalType:
                return factory.updateConditionalTypeNode(<ConditionalTypeNode>node,
                    nodeVisitor((<ConditionalTypeNode>node)., visitor, isTypeNode),
                    nodeVisitor((<ConditionalTypeNode>node)., visitor, isTypeNode),
                    nodeVisitor((<ConditionalTypeNode>node)., visitor, isTypeNode),
                    nodeVisitor((<ConditionalTypeNode>node)., visitor, isTypeNode));

            case SyntaxKind.InferType:
                return factory.updateInferTypeNode(<InferTypeNode>node,
                    nodeVisitor((<InferTypeNode>node)., visitor, isTypeParameterDeclaration));

            case SyntaxKind.ImportType:
                return factory.updateImportTypeNode(<ImportTypeNode>node,
                    nodeVisitor((<ImportTypeNode>node)., visitor, isTypeNode),
                    nodeVisitor((<ImportTypeNode>node)., visitor, isEntityName),
                    visitNodes((<ImportTypeNode>node)., visitor, isTypeNode),
                    (<ImportTypeNode>node).isTypeOf
                );

            case SyntaxKind.NamedTupleMember:
                return factory.updateNamedTupleMember(<NamedTupleMember>node,
                    visitNode((<NamedTupleMember>node)., visitor, isToken),
                    visitNode((<NamedTupleMember>node)., visitor, isIdentifier),
                    visitNode((<NamedTupleMember>node)., visitor, isToken),
                    visitNode((<NamedTupleMember>node)., visitor, isTypeNode),
                );

            case SyntaxKind.ParenthesizedType:
                return factory.updateParenthesizedType(<ParenthesizedTypeNode>node,
                    nodeVisitor((<ParenthesizedTypeNode>node)., visitor, isTypeNode));

            case SyntaxKind.TypeOperator:
                return factory.updateTypeOperatorNode(<TypeOperatorNode>node,
                    nodeVisitor((<TypeOperatorNode>node)., visitor, isTypeNode));

            case SyntaxKind.IndexedAccessType:
                return factory.updateIndexedAccessTypeNode((<IndexedAccessTypeNode>node),
                    nodeVisitor((<IndexedAccessTypeNode>node)., visitor, isTypeNode),
                    nodeVisitor((<IndexedAccessTypeNode>node)., visitor, isTypeNode));

            case SyntaxKind.MappedType:
                return factory.updateMappedTypeNode((<MappedTypeNode>node),
                    nodeVisitor((<MappedTypeNode>node)., tokenVisitor, isToken),
                    nodeVisitor((<MappedTypeNode>node)., visitor, isTypeParameterDeclaration),
                    nodeVisitor((<MappedTypeNode>node)., tokenVisitor, isToken),
                    nodeVisitor((<MappedTypeNode>node)., visitor, isTypeNode));

            case SyntaxKind.LiteralType:
                return factory.updateLiteralTypeNode(<LiteralTypeNode>node,
                    nodeVisitor((<LiteralTypeNode>node)., visitor, isExpression));

            // Binding patterns
            case SyntaxKind.ObjectBindingPattern:
                return factory.updateObjectBindingPattern(<ObjectBindingPattern>node,
                    nodesVisitor((<ObjectBindingPattern>node)., visitor, isBindingElement));

            case SyntaxKind.ArrayBindingPattern:
                return factory.updateArrayBindingPattern(<ArrayBindingPattern>node,
                    nodesVisitor((<ArrayBindingPattern>node)., visitor, isArrayBindingElement));

            case SyntaxKind.BindingElement:
                return factory.updateBindingElement(<BindingElement>node,
                    nodeVisitor((<BindingElement>node)., tokenVisitor, isToken),
                    nodeVisitor((<BindingElement>node)., visitor, isPropertyName),
                    nodeVisitor((<BindingElement>node)., visitor, isBindingName),
                    nodeVisitor((<BindingElement>node)., visitor, isExpression));

            //
            case SyntaxKind.ArrayLiteralExpression:
                return factory.updateArrayLiteralExpression(<ArrayLiteralExpression>node,
                    nodesVisitor((<ArrayLiteralExpression>node)., visitor, isExpression));

            case SyntaxKind.ObjectLiteralExpression:
                return factory.updateObjectLiteralExpression(<ObjectLiteralExpression>node,
                    nodesVisitor((<ObjectLiteralExpression>node)., visitor, isObjectLiteralElementLike));

            case SyntaxKind.PropertyAccessExpression:
                if (node.flags & NodeFlags.OptionalChain) {
                    return factory.updatePropertyAccessChain(<PropertyAccessChain>node,
                        nodeVisitor((<PropertyAccessChain>node)., visitor, isExpression),
                        nodeVisitor((<PropertyAccessChain>node)., tokenVisitor, isToken),
                        nodeVisitor((<PropertyAccessChain>node)., visitor, isIdentifier));
                }
                return factory.updatePropertyAccessExpression(<PropertyAccessExpression>node,
                    nodeVisitor((<PropertyAccessExpression>node)., visitor, isExpression),
                    nodeVisitor((<PropertyAccessExpression>node)., visitor, isIdentifierOrPrivateIdentifier));

            case SyntaxKind.ElementAccessExpression:
                if (node.flags & NodeFlags.OptionalChain) {
                    return factory.updateElementAccessChain(<ElementAccessChain>node,
                        nodeVisitor((<ElementAccessChain>node)., visitor, isExpression),
                        nodeVisitor((<ElementAccessChain>node)., tokenVisitor, isToken),
                        nodeVisitor((<ElementAccessChain>node)., visitor, isExpression));
                }
                return factory.updateElementAccessExpression(<ElementAccessExpression>node,
                    nodeVisitor((<ElementAccessExpression>node)., visitor, isExpression),
                    nodeVisitor((<ElementAccessExpression>node)., visitor, isExpression));

            case SyntaxKind.CallExpression:
                if (node.flags & NodeFlags.OptionalChain) {
                    return factory.updateCallChain(<CallChain>node,
                        nodeVisitor((<CallChain>node)., visitor, isExpression),
                        nodeVisitor((<CallChain>node)., tokenVisitor, isToken),
                        nodesVisitor((<CallChain>node)., visitor, isTypeNode),
                        nodesVisitor((<CallChain>node)., visitor, isExpression));
                }
                return factory.updateCallExpression(<CallExpression>node,
                    nodeVisitor((<CallExpression>node)., visitor, isExpression),
                    nodesVisitor((<CallExpression>node)., visitor, isTypeNode),
                    nodesVisitor((<CallExpression>node)., visitor, isExpression));

            case SyntaxKind.NewExpression:
                return factory.updateNewExpression(<NewExpression>node,
                    nodeVisitor((<NewExpression>node)., visitor, isExpression),
                    nodesVisitor((<NewExpression>node)., visitor, isTypeNode),
                    nodesVisitor((<NewExpression>node)., visitor, isExpression));

            case SyntaxKind.TaggedTemplateExpression:
                return factory.updateTaggedTemplateExpression(<TaggedTemplateExpression>node,
                    nodeVisitor((<TaggedTemplateExpression>node)., visitor, isExpression),
                    visitNodes((<TaggedTemplateExpression>node)., visitor, isExpression),
                    nodeVisitor((<TaggedTemplateExpression>node)., visitor, isTemplateLiteral));

            case SyntaxKind.TypeAssertionExpression:
                return factory.updateTypeAssertion(<TypeAssertion>node,
                    nodeVisitor((<TypeAssertion>node)., visitor, isTypeNode),
                    nodeVisitor((<TypeAssertion>node)., visitor, isExpression));

            case SyntaxKind.ParenthesizedExpression:
                return factory.updateParenthesizedExpression(<ParenthesizedExpression>node,
                    nodeVisitor((<ParenthesizedExpression>node)., visitor, isExpression));

            case SyntaxKind.FunctionExpression:
                return factory.updateFunctionExpression(<FunctionExpression>node,
                    nodesVisitor((<FunctionExpression>node)., visitor, isModifier),
                    nodeVisitor((<FunctionExpression>node)., tokenVisitor, isToken),
                    nodeVisitor((<FunctionExpression>node)., visitor, isIdentifier),
                    nodesVisitor((<FunctionExpression>node)., visitor, isTypeParameterDeclaration),
                    visitParameterList((<FunctionExpression>node)., visitor, context, nodesVisitor),
                    nodeVisitor((<FunctionExpression>node)., visitor, isTypeNode),
                    visitFunctionBody((<FunctionExpression>node)., visitor, context, nodeVisitor));

            case SyntaxKind.ArrowFunction:
                return factory.updateArrowFunction(<ArrowFunction>node,
                    nodesVisitor((<ArrowFunction>node)., visitor, isModifier),
                    nodesVisitor((<ArrowFunction>node)., visitor, isTypeParameterDeclaration),
                    visitParameterList((<ArrowFunction>node)., visitor, context, nodesVisitor),
                    nodeVisitor((<ArrowFunction>node)., visitor, isTypeNode),
                    nodeVisitor((<ArrowFunction>node)., tokenVisitor, isToken),
                    visitFunctionBody((<ArrowFunction>node)., visitor, context, nodeVisitor));

            case SyntaxKind.DeleteExpression:
                return factory.updateDeleteExpression(<DeleteExpression>node,
                    nodeVisitor((<DeleteExpression>node)., visitor, isExpression));

            case SyntaxKind.TypeOfExpression:
                return factory.updateTypeOfExpression(<TypeOfExpression>node,
                    nodeVisitor((<TypeOfExpression>node)., visitor, isExpression));

            case SyntaxKind.VoidExpression:
                return factory.updateVoidExpression(<VoidExpression>node,
                    nodeVisitor((<VoidExpression>node)., visitor, isExpression));

            case SyntaxKind.AwaitExpression:
                return factory.updateAwaitExpression(<AwaitExpression>node,
                    nodeVisitor((<AwaitExpression>node)., visitor, isExpression));

            case SyntaxKind.PrefixUnaryExpression:
                return factory.updatePrefixUnaryExpression(<PrefixUnaryExpression>node,
                    nodeVisitor((<PrefixUnaryExpression>node)., visitor, isExpression));

            case SyntaxKind.PostfixUnaryExpression:
                return factory.updatePostfixUnaryExpression(<PostfixUnaryExpression>node,
                    nodeVisitor((<PostfixUnaryExpression>node)., visitor, isExpression));

            case SyntaxKind.BinaryExpression:
                return factory.updateBinaryExpression(<BinaryExpression>node,
                    nodeVisitor((<BinaryExpression>node)., visitor, isExpression),
                    nodeVisitor((<BinaryExpression>node)., tokenVisitor, isToken),
                    nodeVisitor((<BinaryExpression>node)., visitor, isExpression));

            case SyntaxKind.ConditionalExpression:
                return factory.updateConditionalExpression(<ConditionalExpression>node,
                    nodeVisitor((<ConditionalExpression>node)., visitor, isExpression),
                    nodeVisitor((<ConditionalExpression>node)., tokenVisitor, isToken),
                    nodeVisitor((<ConditionalExpression>node)., visitor, isExpression),
                    nodeVisitor((<ConditionalExpression>node)., tokenVisitor, isToken),
                    nodeVisitor((<ConditionalExpression>node)., visitor, isExpression));

            case SyntaxKind.TemplateExpression:
                return factory.updateTemplateExpression(<TemplateExpression>node,
                    nodeVisitor((<TemplateExpression>node)., visitor, isTemplateHead),
                    nodesVisitor((<TemplateExpression>node)., visitor, isTemplateSpan));

            case SyntaxKind.YieldExpression:
                return factory.updateYieldExpression(<YieldExpression>node,
                    nodeVisitor((<YieldExpression>node)., tokenVisitor, isToken),
                    nodeVisitor((<YieldExpression>node)., visitor, isExpression));

            case SyntaxKind.SpreadElement:
                return factory.updateSpreadElement(<SpreadElement>node,
                    nodeVisitor((<SpreadElement>node)., visitor, isExpression));

            case SyntaxKind.ClassExpression:
                return factory.updateClassExpression(<ClassExpression>node,
                    nodesVisitor((<ClassExpression>node)., visitor, isDecorator),
                    nodesVisitor((<ClassExpression>node)., visitor, isModifier),
                    nodeVisitor((<ClassExpression>node)., visitor, isIdentifier),
                    nodesVisitor((<ClassExpression>node)., visitor, isTypeParameterDeclaration),
                    nodesVisitor((<ClassExpression>node)., visitor, isHeritageClause),
                    nodesVisitor((<ClassExpression>node)., visitor, isClassElement));

            case SyntaxKind.ExpressionWith:
                return factory.updateExpressionWith(<ExpressionWith>node,
                    nodeVisitor((<ExpressionWith>node)., visitor, isExpression),
                    nodesVisitor((<ExpressionWith>node)., visitor, isTypeNode));

            case SyntaxKind.AsExpression:
                return factory.updateAsExpression(<AsExpression>node,
                    nodeVisitor((<AsExpression>node)., visitor, isExpression),
                    nodeVisitor((<AsExpression>node)., visitor, isTypeNode));

            case SyntaxKind.NonNullExpression:
                if (node.flags & NodeFlags.OptionalChain) {
                    return factory.updateNonNullChain(<NonNullChain>node,
                        nodeVisitor((<NonNullChain>node)., visitor, isExpression));
                }
                return factory.updateNonNullExpression(<NonNullExpression>node,
                    nodeVisitor((<NonNullExpression>node)., visitor, isExpression));

            case SyntaxKind.MetaProperty:
                return factory.updateMetaProperty(<MetaProperty>node,
                    nodeVisitor((<MetaProperty>node)., visitor, isIdentifier));

            // Misc
            case SyntaxKind.TemplateSpan:
                return factory.updateTemplateSpan(<TemplateSpan>node,
                    nodeVisitor((<TemplateSpan>node)., visitor, isExpression),
                    nodeVisitor((<TemplateSpan>node)., visitor, isTemplateMiddleOrTemplateTail));

            // Element
            case SyntaxKind.Block:
                return factory.updateBlock(<Block>node,
                    nodesVisitor((<Block>node)., visitor, isStatement));

            case SyntaxKind.VariableStatement:
                return factory.updateVariableStatement(<VariableStatement>node,
                    nodesVisitor((<VariableStatement>node)., visitor, isModifier),
                    nodeVisitor((<VariableStatement>node)., visitor, isVariableDeclarationList));

            case SyntaxKind.ExpressionStatement:
                return factory.updateExpressionStatement(<ExpressionStatement>node,
                    nodeVisitor((<ExpressionStatement>node)., visitor, isExpression));

            case SyntaxKind.IfStatement:
                return factory.updateIfStatement(<IfStatement>node,
                    nodeVisitor((<IfStatement>node)., visitor, isExpression),
                    nodeVisitor((<IfStatement>node)., visitor, isStatement, factory.liftToBlock),
                    nodeVisitor((<IfStatement>node)., visitor, isStatement, factory.liftToBlock));

            case SyntaxKind.DoStatement:
                return factory.updateDoStatement(<DoStatement>node,
                    nodeVisitor((<DoStatement>node)., visitor, isStatement, factory.liftToBlock),
                    nodeVisitor((<DoStatement>node)., visitor, isExpression));

            case SyntaxKind.WhileStatement:
                return factory.updateWhileStatement(<WhileStatement>node,
                    nodeVisitor((<WhileStatement>node)., visitor, isExpression),
                    nodeVisitor((<WhileStatement>node)., visitor, isStatement, factory.liftToBlock));

            case SyntaxKind.ForStatement:
                return factory.updateForStatement(<ForStatement>node,
                    nodeVisitor((<ForStatement>node)., visitor, isForInitializer),
                    nodeVisitor((<ForStatement>node)., visitor, isExpression),
                    nodeVisitor((<ForStatement>node)., visitor, isExpression),
                    nodeVisitor((<ForStatement>node)., visitor, isStatement, factory.liftToBlock));

            case SyntaxKind.ForInStatement:
                return factory.updateForInStatement(<ForInStatement>node,
                    nodeVisitor((<ForInStatement>node)., visitor, isForInitializer),
                    nodeVisitor((<ForInStatement>node)., visitor, isExpression),
                    nodeVisitor((<ForInStatement>node)., visitor, isStatement, factory.liftToBlock));

            case SyntaxKind.ForOfStatement:
                return factory.updateForOfStatement(<ForOfStatement>node,
                    nodeVisitor((<ForOfStatement>node)., tokenVisitor, isToken),
                    nodeVisitor((<ForOfStatement>node)., visitor, isForInitializer),
                    nodeVisitor((<ForOfStatement>node)., visitor, isExpression),
                    nodeVisitor((<ForOfStatement>node)., visitor, isStatement, factory.liftToBlock));

            case SyntaxKind.ContinueStatement:
                return factory.updateContinueStatement(<ContinueStatement>node,
                    nodeVisitor((<ContinueStatement>node)., visitor, isIdentifier));

            case SyntaxKind.BreakStatement:
                return factory.updateBreakStatement(<BreakStatement>node,
                    nodeVisitor((<BreakStatement>node)., visitor, isIdentifier));

            case SyntaxKind.ReturnStatement:
                return factory.updateReturnStatement(<ReturnStatement>node,
                    nodeVisitor((<ReturnStatement>node)., visitor, isExpression));

            case SyntaxKind.WithStatement:
                return factory.updateWithStatement(<WithStatement>node,
                    nodeVisitor((<WithStatement>node)., visitor, isExpression),
                    nodeVisitor((<WithStatement>node)., visitor, isStatement, factory.liftToBlock));

            case SyntaxKind.SwitchStatement:
                return factory.updateSwitchStatement(<SwitchStatement>node,
                    nodeVisitor((<SwitchStatement>node)., visitor, isExpression),
                    nodeVisitor((<SwitchStatement>node)., visitor, isCaseBlock));

            case SyntaxKind.LabeledStatement:
                return factory.updateLabeledStatement(<LabeledStatement>node,
                    nodeVisitor((<LabeledStatement>node)., visitor, isIdentifier),
                    nodeVisitor((<LabeledStatement>node)., visitor, isStatement, factory.liftToBlock));

            case SyntaxKind.ThrowStatement:
                return factory.updateThrowStatement(<ThrowStatement>node,
                    nodeVisitor((<ThrowStatement>node)., visitor, isExpression));

            case SyntaxKind.TryStatement:
                return factory.updateTryStatement(<TryStatement>node,
                    nodeVisitor((<TryStatement>node)., visitor, isBlock),
                    nodeVisitor((<TryStatement>node)., visitor, isCatchClause),
                    nodeVisitor((<TryStatement>node)., visitor, isBlock));

            case SyntaxKind.VariableDeclaration:
                return factory.updateVariableDeclaration(<VariableDeclaration>node,
                    nodeVisitor((<VariableDeclaration>node)., visitor, isBindingName),
                    nodeVisitor((<VariableDeclaration>node)., tokenVisitor, isToken),
                    nodeVisitor((<VariableDeclaration>node)., visitor, isTypeNode),
                    nodeVisitor((<VariableDeclaration>node)., visitor, isExpression));

            case SyntaxKind.VariableDeclarationList:
                return factory.updateVariableDeclarationList(<VariableDeclarationList>node,
                    nodesVisitor((<VariableDeclarationList>node)., visitor, isVariableDeclaration));

            case SyntaxKind.FunctionDeclaration:
                return factory.updateFunctionDeclaration(<FunctionDeclaration>node,
                    nodesVisitor((<FunctionDeclaration>node)., visitor, isDecorator),
                    nodesVisitor((<FunctionDeclaration>node)., visitor, isModifier),
                    nodeVisitor((<FunctionDeclaration>node)., tokenVisitor, isToken),
                    nodeVisitor((<FunctionDeclaration>node)., visitor, isIdentifier),
                    nodesVisitor((<FunctionDeclaration>node)., visitor, isTypeParameterDeclaration),
                    visitParameterList((<FunctionDeclaration>node)., visitor, context, nodesVisitor),
                    nodeVisitor((<FunctionDeclaration>node)., visitor, isTypeNode),
                    visitFunctionBody((<FunctionExpression>node)., visitor, context, nodeVisitor));

            case SyntaxKind.ClassDeclaration:
                return factory.updateClassDeclaration(<ClassDeclaration>node,
                    nodesVisitor((<ClassDeclaration>node)., visitor, isDecorator),
                    nodesVisitor((<ClassDeclaration>node)., visitor, isModifier),
                    nodeVisitor((<ClassDeclaration>node)., visitor, isIdentifier),
                    nodesVisitor((<ClassDeclaration>node)., visitor, isTypeParameterDeclaration),
                    nodesVisitor((<ClassDeclaration>node)., visitor, isHeritageClause),
                    nodesVisitor((<ClassDeclaration>node)., visitor, isClassElement));

            case SyntaxKind.InterfaceDeclaration:
                return factory.updateInterfaceDeclaration(<InterfaceDeclaration>node,
                    nodesVisitor((<InterfaceDeclaration>node)., visitor, isDecorator),
                    nodesVisitor((<InterfaceDeclaration>node)., visitor, isModifier),
                    nodeVisitor((<InterfaceDeclaration>node)., visitor, isIdentifier),
                    nodesVisitor((<InterfaceDeclaration>node)., visitor, isTypeParameterDeclaration),
                    nodesVisitor((<InterfaceDeclaration>node)., visitor, isHeritageClause),
                    nodesVisitor((<InterfaceDeclaration>node)., visitor, isTypeElement));

            case SyntaxKind.TypeAliasDeclaration:
                return factory.updateTypeAliasDeclaration(<TypeAliasDeclaration>node,
                    nodesVisitor((<TypeAliasDeclaration>node)., visitor, isDecorator),
                    nodesVisitor((<TypeAliasDeclaration>node)., visitor, isModifier),
                    nodeVisitor((<TypeAliasDeclaration>node)., visitor, isIdentifier),
                    nodesVisitor((<TypeAliasDeclaration>node)., visitor, isTypeParameterDeclaration),
                    nodeVisitor((<TypeAliasDeclaration>node)., visitor, isTypeNode));

            case SyntaxKind.EnumDeclaration:
                return factory.updateEnumDeclaration(<EnumDeclaration>node,
                    nodesVisitor((<EnumDeclaration>node)., visitor, isDecorator),
                    nodesVisitor((<EnumDeclaration>node)., visitor, isModifier),
                    nodeVisitor((<EnumDeclaration>node)., visitor, isIdentifier),
                    nodesVisitor((<EnumDeclaration>node)., visitor, isEnumMember));

            case SyntaxKind.ModuleDeclaration:
                return factory.updateModuleDeclaration(<ModuleDeclaration>node,
                    nodesVisitor((<ModuleDeclaration>node)., visitor, isDecorator),
                    nodesVisitor((<ModuleDeclaration>node)., visitor, isModifier),
                    nodeVisitor((<ModuleDeclaration>node)., visitor, isIdentifier),
                    nodeVisitor((<ModuleDeclaration>node)., visitor, isModuleBody));

            case SyntaxKind.ModuleBlock:
                return factory.updateModuleBlock(<ModuleBlock>node,
                    nodesVisitor((<ModuleBlock>node)., visitor, isStatement));

            case SyntaxKind.CaseBlock:
                return factory.updateCaseBlock(<CaseBlock>node,
                    nodesVisitor((<CaseBlock>node)., visitor, isCaseOrDefaultClause));

            case SyntaxKind.NamespaceExportDeclaration:
                return factory.updateNamespaceExportDeclaration(<NamespaceExportDeclaration>node,
                    nodeVisitor((<NamespaceExportDeclaration>node)., visitor, isIdentifier));

            case SyntaxKind.ImportEqualsDeclaration:
                return factory.updateImportEqualsDeclaration(<ImportEqualsDeclaration>node,
                    nodesVisitor((<ImportEqualsDeclaration>node)., visitor, isDecorator),
                    nodesVisitor((<ImportEqualsDeclaration>node)., visitor, isModifier),
                    nodeVisitor((<ImportEqualsDeclaration>node)., visitor, isIdentifier),
                    nodeVisitor((<ImportEqualsDeclaration>node)., visitor, isModuleReference));

            case SyntaxKind.ImportDeclaration:
                return factory.updateImportDeclaration(<ImportDeclaration>node,
                    nodesVisitor((<ImportDeclaration>node)., visitor, isDecorator),
                    nodesVisitor((<ImportDeclaration>node)., visitor, isModifier),
                    nodeVisitor((<ImportDeclaration>node)., visitor, isImportClause),
                    nodeVisitor((<ImportDeclaration>node)., visitor, isExpression));

            case SyntaxKind.ImportClause:
                return factory.updateImportClause(<ImportClause>node,
                    (node as ImportClause).isTypeOnly,
                    nodeVisitor((<ImportClause>node)., visitor, isIdentifier),
                    nodeVisitor((<ImportClause>node)., visitor, isNamedImportBindings));

            case SyntaxKind.NamespaceImport:
                return factory.updateNamespaceImport(<NamespaceImport>node,
                    nodeVisitor((<NamespaceImport>node)., visitor, isIdentifier));

            case SyntaxKind.NamespaceExport:
                    return factory.updateNamespaceExport(<NamespaceExport>node,
                        nodeVisitor((<NamespaceExport>node)., visitor, isIdentifier));

            case SyntaxKind.NamedImports:
                return factory.updateNamedImports(<NamedImports>node,
                    nodesVisitor((<NamedImports>node)., visitor, isImportSpecifier));

            case SyntaxKind.ImportSpecifier:
                return factory.updateImportSpecifier(<ImportSpecifier>node,
                    nodeVisitor((<ImportSpecifier>node)., visitor, isIdentifier),
                    nodeVisitor((<ImportSpecifier>node)., visitor, isIdentifier));

            case SyntaxKind.ExportAssignment:
                return factory.updateExportAssignment(<ExportAssignment>node,
                    nodesVisitor((<ExportAssignment>node)., visitor, isDecorator),
                    nodesVisitor((<ExportAssignment>node)., visitor, isModifier),
                    nodeVisitor((<ExportAssignment>node)., visitor, isExpression));

            case SyntaxKind.ExportDeclaration:
                return factory.updateExportDeclaration(<ExportDeclaration>node,
                    nodesVisitor((<ExportDeclaration>node)., visitor, isDecorator),
                    nodesVisitor((<ExportDeclaration>node)., visitor, isModifier),
                    (node as ExportDeclaration).isTypeOnly,
                    nodeVisitor((<ExportDeclaration>node)., visitor, isNamedExportBindings),
                    nodeVisitor((<ExportDeclaration>node)., visitor, isExpression));

            case SyntaxKind.NamedExports:
                return factory.updateNamedExports(<NamedExports>node,
                    nodesVisitor((<NamedExports>node)., visitor, isExportSpecifier));

            case SyntaxKind.ExportSpecifier:
                return factory.updateExportSpecifier(<ExportSpecifier>node,
                    nodeVisitor((<ExportSpecifier>node)., visitor, isIdentifier),
                    nodeVisitor((<ExportSpecifier>node)., visitor, isIdentifier));

            // Module references
            case SyntaxKind.ExternalModuleReference:
                return factory.updateExternalModuleReference(<ExternalModuleReference>node,
                    nodeVisitor((<ExternalModuleReference>node)., visitor, isExpression));

            // JSX
            case SyntaxKind.JsxElement:
                return factory.updateJsxElement(<JsxElement>node,
                    nodeVisitor((<JsxElement>node)., visitor, isJsxOpeningElement),
                    nodesVisitor((<JsxElement>node)., visitor, isJsxChild),
                    nodeVisitor((<JsxElement>node)., visitor, isJsxClosingElement));

            case SyntaxKind.JsxSelfClosingElement:
                return factory.updateJsxSelfClosingElement(<JsxSelfClosingElement>node,
                    nodeVisitor((<JsxSelfClosingElement>node)., visitor, isJsxTagNameExpression),
                    nodesVisitor((<JsxSelfClosingElement>node)., visitor, isTypeNode),
                    nodeVisitor((<JsxSelfClosingElement>node)., visitor, isJsxAttributes));

            case SyntaxKind.JsxOpeningElement:
                return factory.updateJsxOpeningElement(<JsxOpeningElement>node,
                    nodeVisitor((<JsxOpeningElement>node)., visitor, isJsxTagNameExpression),
                    nodesVisitor((<JsxSelfClosingElement>node)., visitor, isTypeNode),
                    nodeVisitor((<JsxOpeningElement>node)., visitor, isJsxAttributes));

            case SyntaxKind.JsxClosingElement:
                return factory.updateJsxClosingElement(<JsxClosingElement>node,
                    nodeVisitor((<JsxClosingElement>node)., visitor, isJsxTagNameExpression));

            case SyntaxKind.JsxFragment:
                return factory.updateJsxFragment(<JsxFragment>node,
                    nodeVisitor((<JsxFragment>node)., visitor, isJsxOpeningFragment),
                    nodesVisitor((<JsxFragment>node)., visitor, isJsxChild),
                    nodeVisitor((<JsxFragment>node)., visitor, isJsxClosingFragment));

            case SyntaxKind.JsxAttribute:
                return factory.updateJsxAttribute(<JsxAttribute>node,
                    nodeVisitor((<JsxAttribute>node)., visitor, isIdentifier),
                    nodeVisitor((<JsxAttribute>node)., visitor, isStringLiteralOrJsxExpression));

            case SyntaxKind.JsxAttributes:
                return factory.updateJsxAttributes(<JsxAttributes>node,
                    nodesVisitor((<JsxAttributes>node)., visitor, isJsxAttributeLike));

            case SyntaxKind.JsxSpreadAttribute:
                return factory.updateJsxSpreadAttribute(<JsxSpreadAttribute>node,
                    nodeVisitor((<JsxSpreadAttribute>node)., visitor, isExpression));

            case SyntaxKind.JsxExpression:
                return factory.updateJsxExpression(<JsxExpression>node,
                    nodeVisitor((<JsxExpression>node)., visitor, isExpression));

            // Clauses
            case SyntaxKind.CaseClause:
                return factory.updateCaseClause(<CaseClause>node,
                    nodeVisitor((<CaseClause>node)., visitor, isExpression),
                    nodesVisitor((<CaseClause>node)., visitor, isStatement));

            case SyntaxKind.DefaultClause:
                return factory.updateDefaultClause(<DefaultClause>node,
                    nodesVisitor((<DefaultClause>node)., visitor, isStatement));

            case SyntaxKind.HeritageClause:
                return factory.updateHeritageClause(<HeritageClause>node,
                    nodesVisitor((<HeritageClause>node)., visitor, isExpressionWith));

            case SyntaxKind.CatchClause:
                return factory.updateCatchClause(<CatchClause>node,
                    nodeVisitor((<CatchClause>node)., visitor, isVariableDeclaration),
                    nodeVisitor((<CatchClause>node)., visitor, isBlock));

            // Property assignments
            case SyntaxKind.PropertyAssignment:
                return factory.updatePropertyAssignment(<PropertyAssignment>node,
                    nodeVisitor((<PropertyAssignment>node)., visitor, isPropertyName),
                    nodeVisitor((<PropertyAssignment>node)., visitor, isExpression));

            case SyntaxKind.ShorthandPropertyAssignment:
                return factory.updateShorthandPropertyAssignment(<ShorthandPropertyAssignment>node,
                    nodeVisitor((<ShorthandPropertyAssignment>node)., visitor, isIdentifier),
                    nodeVisitor((<ShorthandPropertyAssignment>node)., visitor, isExpression));

            case SyntaxKind.SpreadAssignment:
                return factory.updateSpreadAssignment(<SpreadAssignment>node,
                    nodeVisitor((<SpreadAssignment>node)., visitor, isExpression));

            // Enum
            case SyntaxKind.EnumMember:
                return factory.updateEnumMember(<EnumMember>node,
                    nodeVisitor((<EnumMember>node)., visitor, isPropertyName),
                    nodeVisitor((<EnumMember>node)., visitor, isExpression));

            // Top-level nodes
            case SyntaxKind.SourceFile:
                return factory.updateSourceFile(<SourceFile>node,
                    visitLexicalEnvironment((<SourceFile>node)., visitor, context));

            // Transformation nodes
            case SyntaxKind.PartiallyEmittedExpression:
                return factory.updatePartiallyEmittedExpression(<PartiallyEmittedExpression>node,
                    nodeVisitor((<PartiallyEmittedExpression>node)., visitor, isExpression));

            case SyntaxKind.CommaListExpression:
                return factory.updateCommaListExpression(<CommaListExpression>node,
                    nodesVisitor((<CommaListExpression>node)., visitor, isExpression));

            :
                // No need to visit nodes with no .
                return node;
        }

    }

    /**
     * Extracts the single node from a NodeArray.
     *
     * @param nodes The NodeArray.
     */
    function extractSingleNode(nodes: readonly Node[]): Node | undefined {
        Debug.assert(nodes.length <= 1, "Too many nodes written to output.");
        return singleOrUndefined(nodes);
    }
}
