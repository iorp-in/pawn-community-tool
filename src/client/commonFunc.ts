import * as vscode from 'vscode';

export const initSnippetCollector = async () => {
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