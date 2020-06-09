import * as vscode from 'vscode';

const PawnHoverProvider = {
    provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Hover> {
        return {
            contents: ['Hover Content']
        };
    }
};

export default PawnHoverProvider;