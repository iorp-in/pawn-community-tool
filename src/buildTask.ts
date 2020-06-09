import * as vscode from 'vscode';
import * as fs from 'fs';
import { task } from "./task";

const BuildTaskHandler = async function () {
    if (!fs.existsSync(vscode.workspace.rootPath + "/.vscode")) {
        fs.mkdirSync(vscode.workspace.rootPath + "/.vscode");
        vscode.window.showInformationMessage("Created .vscode");
    }

    if (!fs.existsSync(vscode.workspace.rootPath + "/.vscode/tasks.json")) {
        fs.writeFileSync(vscode.workspace.rootPath + "/.vscode/tasks.json", task);
        vscode.window.showInformationMessage("Successfully written tasks.json");
    }
    else { vscode.window.showInformationMessage("tasks.json already exists"); }

    vscode.workspace.openTextDocument(vscode.workspace.rootPath + "/.vscode/tasks.json").then((a: vscode.TextDocument) => {
        vscode.window.showTextDocument(a, 1, false);
    }, (error: any) => {
        console.error(error);
    });
};

export default BuildTaskHandler;