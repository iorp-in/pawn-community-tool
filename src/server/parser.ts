import { TextDocument, CompletionItem, CompletionItemKind, Definition, Location, Range, MarkedString, Hover, SignatureHelp, Position, SignatureHelpParams, ParameterInformation } from "vscode-languageserver";
import { findFunctionIdentifier, positionToIndex, findIdentifierAtCursor } from "./common";

interface PawnFunction {
    completion: CompletionItem;
    definition: Definition;
    params: ParameterInformation[];
}
let pawnFuncCollection: Map<string, PawnFunction> = new Map();

const regex = /(forward|native|stock)\s(.*?)\((.*?)\)/gm;
export const parseSnippets = async (textDocument: TextDocument) => {
    const content = textDocument.getText();
    const splitContent = content.split('\n');
    splitContent.forEach((cont: string, index: number) => {
        var m;
        do {
            m = regex.exec(cont);
            if (m) {
                const newSnip: CompletionItem = {
                    label: m[2],
                    kind: CompletionItemKind.Function,
                    insertText: m[2] + '(' + m[3] + ')',
                    documentation: m[2] + '(' + m[3] + ')',
                };
                const newDef: Definition = Location.create(textDocument.uri, {
                    start: { line: index, character: m.input.indexOf(m[2]) },
                    end: { line: index, character: m.input.indexOf(m[2]) + m[2].length }

                });
                let params: ParameterInformation[] = [];
                if (m[3].trim().length > 0) {
                    params = m[3].split(',').map((value) => ({ label: value.trim() }));
                } else {
                    params = [];
                }
                const pwnFun: PawnFunction = {
                    definition: newDef,
                    completion: newSnip,
                    params
                };
                const findSnip = pawnFuncCollection.get(m[2]);
                if (findSnip === undefined) pawnFuncCollection.set(m[2], pwnFun);
            }
        } while (m);
    });

};

export const doCompletion = async () => {
    const comItems: CompletionItem[] = [];
    pawnFuncCollection.forEach(res => comItems.push(res.completion));
    return comItems;
};

export const doCompletionResolve = async (item: CompletionItem) => {
    return item;
};

export const doHover = (document: TextDocument, position: Position): Hover | undefined => {
    const cursorIndex = positionToIndex(document.getText(), position);
    const result = findIdentifierAtCursor(document.getText(), cursorIndex);
    const snip = pawnFuncCollection.get(result.identifier);
    if (snip === undefined) return undefined;
    let c: MarkedString[] = [];
    if (snip.completion.label !== undefined) c.push(`# ${snip.completion.label}`);
    if (snip.completion.documentation !== undefined) c.push(`${snip.completion.documentation}`);
    return {
        contents: c
    };
};

export const doSignHelp = (document: TextDocument, position: Position): SignatureHelp | undefined => {
    const cursorIndex = positionToIndex(document.getText(), position);
    const result = findFunctionIdentifier(document.getText(), cursorIndex);
    if (result.identifier === '') return undefined;
    const snip = pawnFuncCollection.get(result.identifier);
    if (snip === undefined) return undefined;
    let c: MarkedString[] = [];
    if (snip.completion.label !== undefined) c.push(`# ${snip.completion.label}`);
    if (snip.completion.documentation !== undefined) c.push(`${snip.completion.documentation}`);
    return {
        activeParameter: 0,
        activeSignature: 0,
        signatures: [{
            label: snip.completion.label,
            parameters: snip.params,
            documentation: snip.completion.documentation
        }]
    };
};

export const doGoToDef = (document: TextDocument, position: Position) => {
    const cursorIndex = positionToIndex(document.getText(), position);
    const result = findIdentifierAtCursor(document.getText(), cursorIndex);
    const snip = pawnFuncCollection.get(result.identifier);
    if (snip === undefined) return;
    return snip.definition;
};