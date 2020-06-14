import BuildTaskHandler from './buildTask';
import PawnDocumentFormattingEditProvider from './formatter';
import * as vscode from 'vscode';
import provideCompletion, { initSnippetCollector } from './completionProvider';

export async function activate(context: vscode.ExtensionContext) {  // The server is implemented in node
	context.subscriptions.push(vscode.commands.registerCommand('pawn-community-tool.initTask', BuildTaskHandler));
	vscode.languages.registerDocumentFormattingEditProvider('pawn', PawnDocumentFormattingEditProvider);
	vscode.languages.registerCompletionItemProvider('pawn', provideCompletion);
	vscode.languages.registerDocumentRangeFormattingEditProvider('pawn', PawnDocumentFormattingEditProvider);
	vscode.workspace.onDidSaveTextDocument((document: vscode.TextDocument) => {
		initSnippetCollector();
	});
	initSnippetCollector();
}