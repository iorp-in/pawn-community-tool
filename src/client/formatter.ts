import * as vscode from 'vscode';
import * as jsbeautifier from 'js-beautify';

interface RegexCodeFix {
    expr: RegExp;
    replacement: string;
}

const beforeFix: RegexCodeFix[] = [
    { expr: /(^[ \t]+#|^#)/gm, replacement: "//iorp_tag_hash_$1" },
    { expr: /([^\s:]):([^\s:])(?=(?:[^"]*"[^"]*")*[^"]*$)/gm, replacement: "$1iorp_tag_semicolon$2" },
    { expr: /([^\s:])::([^\s:])(?=(?:[^"]*"[^"]*")*[^"]*$)/gm, replacement: "$1iorp_tag_two_semicolon$2" },
    { expr: /([^\s:]): +([^\s:])(?=(?:[^"]*"[^"]*")*[^"]*$)/gm, replacement: "$1iorp_tag_three_semicolon$2" },
    { expr: /([^\s:]):: +([^\s:])(?=(?:[^"]*"[^"]*")*[^"]*$)/gm, replacement: "$1iorp_tag_four_semicolon$2" },
    { expr: /([^\s:])@([^\s:])(?=(?:[^"]*"[^"]*")*[^"]*$)/gm, replacement: "$1iorp_tag_at$2" },
    { expr: /\bconst\b/gm, replacement: "iorp_tag_const" },
];

const afterFix: RegexCodeFix[] = [
    { expr: /\biorp_tag_const\b/gm, replacement: "const" },
    { expr: /iorp_tag_semicolon/gm, replacement: ":" },
    { expr: /iorp_tag_two_semicolon/gm, replacement: "::" },
    { expr: /iorp_tag_three_semicolon/gm, replacement: ": " },
    { expr: /iorp_tag_four_semicolon/gm, replacement: ":: " },
    { expr: /iorp_tag_at/gm, replacement: "@" },
    // { expr: /(^if +\(|^[ \t]+if +\()(?=(?:[^"]*"[^"]*")*[^"]*$)/gm, replacement: "if(" },
    { expr: />(\s+)\nhook/gm, replacement: ">\nhook" },
    { expr: /static(\s+)const/gm, replacement: "static const" },
    { expr: /\.\s\./gm, replacement: ".." },
    { expr: /^[ \t]+\/\/iorp_tag_hash_|^\/\/iorp_tag_hash_/gm, replacement: "" },
];

const formatPawn = (content: string) => {
    const brace_style = vscode.workspace.getConfiguration().get('pawn.language.brace_style') as "collapse" | "expand" | "end-expand" | "none" | "preserve-inline" | null;
    for (const key in beforeFix) {
        if (beforeFix.hasOwnProperty(key)) {
            const element = beforeFix[key];
            content = content.replace(element.expr, element.replacement);
        }
    }
    content = jsbeautifier.js_beautify(content, {
        brace_style: brace_style === null ? undefined : brace_style
    });
    for (const key in afterFix) {
        if (afterFix.hasOwnProperty(key)) {
            const element = afterFix[key];
            content = content.replace(element.expr, element.replacement);
        }
    }
    return content;
};

const PawnDocumentFormattingEditProvider = {
    provideDocumentFormattingEdits(document: vscode.TextDocument, options: vscode.FormattingOptions, token: vscode.CancellationToken): vscode.ProviderResult<Array<vscode.TextEdit>> {
        const edits: vscode.TextEdit[] = [];
        var content = document.getText();
        content = formatPawn(content);
        const range = new vscode.Range(new vscode.Position(0, 0), document.lineAt(document.lineCount - 1).range.end);
        edits.push(new vscode.TextEdit(range, content));
        return edits;
    },
    provideDocumentRangeFormattingEdits(document: vscode.TextDocument, range: vscode.Range, options: vscode.FormattingOptions, token: vscode.CancellationToken): vscode.ProviderResult<Array<vscode.TextEdit>> {
        const edits: vscode.TextEdit[] = [];
        var content = document.getText(range);
        content = formatPawn(content);
        edits.push(new vscode.TextEdit(range, content));
        return edits;
    }
};


export default PawnDocumentFormattingEditProvider;