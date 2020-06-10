import * as vscode from 'vscode';
import * as jsbeautifier from 'js-beautify';

const PawnDocumentFormattingEditProvider = {
    provideDocumentFormattingEdits(document: vscode.TextDocument, options: vscode.FormattingOptions, token: vscode.CancellationToken): vscode.ProviderResult<Array<vscode.TextEdit>> {
        const edits: vscode.TextEdit[] = [];
        var content = document.getText();
        const firstLine = document.lineAt(0);
        if (firstLine.text !== '// IORP Script') {
            edits.push(vscode.TextEdit.insert(firstLine.range.start, "// IORP Script\n"));
        }
        content = content.replace(/#/gm, "//#");
        content = content.replace(/\bconst\b/gm, "iorp_tag_const");
        content = jsbeautifier.js_beautify(content, {
            brace_style: 'collapse-preserve-inline'
        });
        content = content.replace(/\/\/#/gm, "#");
        content = content.replace(/\biorp_tag_const\b/gm, "const");
        content = content.replace(/:\s(?=(?:[^"]*"[^"]*")*[^"]*$)/gm, ":");
        content = content.replace(/if(\s+)\(/gm, "if(");
        content = content.replace(/>(\s+)\nhook/gm, ">\nhook");
        content = content.replace(/static(\s+)const/gm, "static const");
        content = content.replace(/\.\s\./gm, "..");
        const range = new vscode.Range(new vscode.Position(0, 0), document.lineAt(document.lineCount - 1).range.end);
        edits.push(new vscode.TextEdit(range, content));
        return edits;
    },
    provideDocumentRangeFormattingEdits(document: vscode.TextDocument, range: vscode.Range, options: vscode.FormattingOptions, token: vscode.CancellationToken): vscode.ProviderResult<Array<vscode.TextEdit>> {
        const edits: vscode.TextEdit[] = [];
        var content = document.getText(range);
        const firstLine = document.lineAt(0);
        if (firstLine.text !== '// IORP Script') {
            edits.push(vscode.TextEdit.insert(firstLine.range.start, "// IORP Script\n"));
        }
        content = content.replace(/#/gm, "//#");
        content = content.replace(/\bconst\b/gm, "iorp_tag_const");
        content = jsbeautifier.js_beautify(content, {
            brace_style: 'collapse-preserve-inline'
        });
        content = content.replace(/\/\/#/gm, "#");
        content = content.replace(/\biorp_tag_const\b/gm, "const");
        content = content.replace(/:\s(?=(?:[^"]*"[^"]*")*[^"]*$)/gm, ":");
        content = content.replace(/if(\s+)\(/gm, "if(");
        content = content.replace(/>(\s+)\nhook/gm, ">\nhook");
        content = content.replace(/static(\s+)const/gm, "static const");
        content = content.replace(/\.\s\./gm, "..");
        edits.push(new vscode.TextEdit(range, content));
        return edits;
    }
};


export default PawnDocumentFormattingEditProvider;