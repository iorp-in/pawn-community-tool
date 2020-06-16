import {
    TextDocument, CompletionItem, CompletionItemKind, Definition, Location, MarkedString, Hover, SignatureHelp, Position,
    ParameterInformation
} from "vscode-languageserver";
import { findFunctionIdentifier, positionToIndex, findIdentifierAtCursor } from "./common";

interface PawnFunction {
    textDocument: TextDocument;
    completion: CompletionItem;
    definition: Definition;
    params: ParameterInformation[];
}
let pawnFuncCollection: Map<string, PawnFunction> = new Map();

const regex = /(forward|native|stock)\s(.*?)\((.*?)\)/gm;
export const parseSnippets = async (textDocument: TextDocument) => {
    pawnFuncCollection.forEach((value: PawnFunction, key: string) => {
        if (value.textDocument.uri === textDocument.uri) pawnFuncCollection.delete(key);
    });
    const content = textDocument.getText();
    const splitContent = content.split('\n');
    splitContent.forEach((cont: string, index: number) => {
        var m;
        do {
            m = regex.exec(cont);
            if (m) {
                let doc: string = '';
                let endDoc = -1;
                if (splitContent[index - 1] !== undefined) endDoc = splitContent[index - 1].indexOf('*/');
                if (endDoc !== -1) {
                    let startDoc = -1;
                    let inNum = index;
                    while (inNum >= 0) {
                        inNum--;
                        if (splitContent[inNum] === undefined) continue;
                        startDoc = splitContent[inNum].indexOf('/*');
                        if (startDoc !== -1) {
                            if (inNum === index) {
                                doc = splitContent[index];
                            } else if (inNum < index) {
                                while (inNum < index) {
                                    doc += splitContent[inNum] + '\n\n';
                                    inNum++;

                                }
                            }
                            break;
                        }
                    }
                }
                doc = doc.replace('/*', '').replace('*/', '').trim();
                const newSnip: CompletionItem = {
                    label: m[2] + '(' + m[3] + ')',
                    kind: CompletionItemKind.Function,
                    insertText: m[2] + '(' + m[3] + ')',
                    documentation: doc,
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
                    textDocument: textDocument,
                    definition: newDef,
                    completion: newSnip,
                    params
                };
                const indexPos = m[2].indexOf(':');
                if (indexPos !== -1) {
                    const resOut = /:(.*)/gm.exec(m[2]);
                    if (resOut) m[2] = resOut[1];
                }
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
    if (snip.completion.label !== undefined) c.push(`${snip.completion.label}`);
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