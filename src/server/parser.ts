import { TextDocument, CompletionItem, CompletionItemKind, Definition, Location, Range, MarkedString, Hover, SignatureHelp } from "vscode-languageserver";

let snippetCollection: Map<string, CompletionItem> = new Map();
let definationCollection: Map<string, Definition> = new Map();

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
                const findSnip = snippetCollection.get(m[2]);
                if (findSnip === undefined) snippetCollection.set(m[2], newSnip);
                const findDef = definationCollection.get(m[2]);
                const newDef: Definition = Location.create(textDocument.uri, {
                    start: { line: index, character: m.input.indexOf(m[2]) },
                    end: { line: index, character: m.input.indexOf(m[2]) + m[2].length }

                });
                if (findDef === undefined) definationCollection.set(m[2], newDef);
            }
        } while (m);
    });

};

export const doCompletion = async () => {
    return Array.from(snippetCollection.values());
};

export const doCompletionResolve = async (item: CompletionItem) => {
    return item;
};

export const doHover = (document: TextDocument, offset: number): Hover | undefined => {
    const word = getCurrentWord(document, offset);
    const snip = snippetCollection.get(word);
    if (snip === undefined) return undefined;
    let c: MarkedString[] = [];
    if (snip.label !== undefined) c.push(`# ${snip.label}`);
    if (snip.documentation !== undefined) c.push(`${snip.documentation}`);
    return {
        contents: c
    };
};

export const doSignHelp = (document: TextDocument, offset: number): SignatureHelp | undefined => {
    const word = getCurrentWord(document, offset);
    const snip = snippetCollection.get(word);
    if (snip === undefined) return undefined;
    let c: MarkedString[] = [];
    if (snip.label !== undefined) c.push(`# ${snip.label}`);
    if (snip.documentation !== undefined) c.push(`${snip.documentation}`);
    return {
        activeParameter: 0,
        activeSignature: 0,
        signatures: [{
            label: snip.label,
            parameters: [{
                label: snip.label
            }]
        }]
    };
};

export const doGoToDef = (document: TextDocument, offset: number) => {
    const word = getCurrentWord(document, offset);
    const snip = definationCollection.get(word);
    if (snip === undefined) return;
    return snip;
};

const spaces: string = ' \t\n\r":{[()]},;-=><';
export function getCurrentWord(document: TextDocument, offset: number) {
    let i = offset - 1;
    let text = document.getText();
    while (i >= 0 && spaces.indexOf(text.charAt(i)) === -1) {
        i--;
    }

    let j = offset;
    while (j < text.length && spaces.indexOf(text.charAt(j)) === -1) {
        j++;
    }
    return text.substring(i + 1, j).trim();
}


