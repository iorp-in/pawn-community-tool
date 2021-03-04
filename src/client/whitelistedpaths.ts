import * as vscode from 'vscode';
import * as fs from 'fs';

const noWorkSpaceError = "you can use this command inside your workspace only";
const writeonfile = `// only relative path are allowed inside workspace
// relative paths defined in this file, will be used to scan for definations by pawn community tool extension.
// if you are unfamilliar with this file, please delete this to avoid confusions and normally use pawn community tool extension.
// if you are having problems, please report issue at https://github.com/oceanroleplay/pawn-community-tool/issues
// exmaples of folders:
// gamemodes
// pawno/include

gamemodes
pawno/include
`;

const WhiteListedTaskHandler = async function () {
    let workspacePath = undefined;
    if (vscode.workspace.workspaceFolders === undefined) return vscode.window.showInformationMessage(noWorkSpaceError);
    if (vscode.workspace.workspaceFolders.length === 0) return vscode.window.showInformationMessage(noWorkSpaceError);
    if (vscode.workspace.workspaceFolders.length === 1) { workspacePath = vscode.workspace.workspaceFolders[0].uri.fsPath; }

    if (vscode.workspace.workspaceFolders.length > 1) {
        const result = await vscode.window.showWorkspaceFolderPick();
        if (result === undefined) return;
        workspacePath = result.uri.fsPath;
    }

    if (workspacePath === undefined) return vscode.window.showInformationMessage(noWorkSpaceError);

    if (!fs.existsSync(workspacePath + "/.vscode")) {
        fs.mkdirSync(workspacePath + "/.vscode");
        vscode.window.showInformationMessage("Created .vscode");
    }

    if (!fs.existsSync(workspacePath + "/.vscode/pawn-community-tool-whitelisted-paths.txt")) {
        fs.writeFileSync(workspacePath + "/.vscode/pawn-community-tool-whitelisted-paths.txt", writeonfile);
        vscode.window.showInformationMessage("Successfully written pawn-community-tool-whitelisted-paths.txt");
    }
    else { vscode.window.showInformationMessage("pawn-community-tool-whitelisted-paths.txt already exists, aborting task"); }

    vscode.workspace.openTextDocument(workspacePath + "/.vscode/pawn-community-tool-whitelisted-paths.txt").then((a: vscode.TextDocument) => {
        vscode.window.showTextDocument(a, 1, false);
    }, (error: any) => {
        console.error(error);
    });
};

export default WhiteListedTaskHandler;