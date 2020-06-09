import BuildTaskHandler from './buildTask';
import PawnDocumentFormattingEditProvider from './formatter';
import PawnHoverProvider from './HoverProvider';
import {
	workspace as Workspace, window as Window, ExtensionContext, TextDocument, OutputChannel, WorkspaceFolder, Uri, commands, languages, DocumentSelector, SnippetString
} from 'vscode';


export function activate(context: ExtensionContext) {  // The server is implemented in node
	context.subscriptions.push(commands.registerCommand('pawn-community-tool.initTask', BuildTaskHandler));
	languages.registerDocumentFormattingEditProvider('pawn', PawnDocumentFormattingEditProvider);
	languages.registerDocumentRangeFormattingEditProvider('pawn', PawnDocumentFormattingEditProvider);
	//languages.registerHoverProvider('pawn', PawnHoverProvider);
}

export function deactivate() {
}
