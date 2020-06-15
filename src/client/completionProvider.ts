import * as vscode from 'vscode';
import { exists, existsSync } from 'fs';

let snippetCollection: Map<string, vscode.CompletionItem> = new Map();

export const initSnippetCollector = async () => {
    snippetCollection.clear();
    const files = await vscode.workspace.findFiles('**/*.pwn');
    for (const key in files) {
        if (files.hasOwnProperty(key)) {
            const element = files[key];
            const content = (await vscode.workspace.openTextDocument(element)).getText();
        }
    }
    const filesInc = await vscode.workspace.findFiles('**/*.inc');
    for (const key in filesInc) {
        if (filesInc.hasOwnProperty(key)) {
            const element = filesInc[key];
            const content = (await vscode.workspace.openTextDocument(element)).getText();
        }
    }
};

const parseSnippets = (content: string) => {
    const regex = /(forward|native|stock)\s(.*?)\((.*?)\)/gm;
    var m;
    do {
        m = regex.exec(content);
        if (m) {
            const newSnip = new vscode.CompletionItem(m[2]);
            newSnip.insertText = m[2] + '(' + m[3] + ')';
            newSnip.kind = vscode.CompletionItemKind.Function;
            const findSnip = snippetCollection.get(m[2]);
            if (findSnip === undefined) snippetCollection.set(m[2], newSnip);
        }
    } while (m);
};

const provideCompletion = {
    provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {
        return Array.from(snippetCollection.values());
    }
};

export default provideCompletion;