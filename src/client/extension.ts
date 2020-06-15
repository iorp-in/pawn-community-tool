import BuildTaskHandler from './buildTask';
import PawnDocumentFormattingEditProvider from './formatter';
import * as vscode from 'vscode';
import * as VLC from 'vscode-languageclient';
import * as VLSC from 'vscode-languageserver';
import provideCompletion, { initSnippetCollector } from './completionProvider';
import path = require('path');

let client: VLC.LanguageClient;

export async function activate(context: vscode.ExtensionContext) {  // The server is implemented in node
	context.subscriptions.push(vscode.commands.registerCommand('pawn-community-tool.initTask', BuildTaskHandler));
	vscode.languages.registerDocumentFormattingEditProvider('pawn', PawnDocumentFormattingEditProvider);
	vscode.languages.registerDocumentRangeFormattingEditProvider('pawn', PawnDocumentFormattingEditProvider);
	initSnippetCollector();

	let serverModule = context.asAbsolutePath(path.join('out', 'server', 'server.js'));
	let debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };

	// If the extension is launched in debug mode then the debug server options are used
	// Otherwise the run options are used
	let serverOptions: VLC.ServerOptions = {
		run: { module: serverModule, transport: VLC.TransportKind.ipc },
		debug: {
			module: serverModule,
			transport: VLC.TransportKind.ipc,
			options: debugOptions
		}
	};

	// Options to control the language client
	let clientOptions: VLC.LanguageClientOptions = {
		// Register the server for plain text documents
		documentSelector: [{ scheme: 'file', language: 'pawn' }],
		synchronize: {
			// Notify the server about file changes to '.clientrc files contained in the workspace
			fileEvents: vscode.workspace.createFileSystemWatcher('**/.pwn')
		}
	};

	// Create the language client and start the client.
	client = new VLC.LanguageClient(
		'Pawn Client',
		'Pawn Server',
		serverOptions,
		clientOptions
	);

	// Start the client. This will also launch the server
	client.start();
}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}
