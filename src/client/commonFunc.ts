import * as vscode from 'vscode';

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