import BuildTaskHandler from './buildTask';
import PawnDocumentFormattingEditProvider from './formatter';
import PawnHoverProvider from './HoverProvider';
import {
	workspace as Workspace, window as Window, ExtensionContext, TextDocument, OutputChannel, WorkspaceFolder, Uri, commands, languages, DocumentSelector, SnippetString
} from 'vscode';
import * as Path from 'path';
import * as VSC from 'vscode';
import * as VSCLC from 'vscode-languageclient';
import * as Commands from './commands';
let diagnosticCollection: VSC.DiagnosticCollection;

export function activate(context: ExtensionContext) {  // The server is implemented in node
	context.subscriptions.push(commands.registerCommand('pawn-community-tool.initTask', BuildTaskHandler));
	languages.registerDocumentFormattingEditProvider('pawn', PawnDocumentFormattingEditProvider);
	languages.registerDocumentRangeFormattingEditProvider('pawn', PawnDocumentFormattingEditProvider);
	//languages.registerHoverProvider('pawn', PawnHoverProvider);
	const serverModulePath = context.asAbsolutePath(Path.join('out', 'server', 'server.js'));
	const debugOptions = { execArgv: ['--nolazy', '--inspect=5858'] };

	const serverOptions: VSCLC.ServerOptions = {
		run: {
			module: serverModulePath,
			transport: VSCLC.TransportKind.ipc,
			options: debugOptions
		},
		debug: {
			module: serverModulePath,
			transport: VSCLC.TransportKind.ipc,
			options: debugOptions
		}
	};

	const clientOptions: VSCLC.LanguageClientOptions = {
		documentSelector: ['pawn'],
		synchronize: {
			configurationSection: [
				'pawn.language',
				'pawn.compiler'
			],
			fileEvents: VSC.workspace.createFileSystemWatcher('**/*.*')
		}
	};

	const languageClient = new VSCLC.LanguageClient('pawn', 'Pawn Language Service', serverOptions, clientOptions);

	const outputChannel = VSC.window.createOutputChannel('PAWN Output');

	diagnosticCollection = VSC.languages.createDiagnosticCollection('pawn');

	const commandCompile = VSC.commands.registerCommand('pawn.compile', Commands.compile.bind(null, outputChannel, diagnosticCollection));
	const commandCompileLocal = VSC.commands.registerCommand('pawn.compileLocal', Commands.compileLocal.bind(null, outputChannel, diagnosticCollection));

	VSC.workspace.onDidChangeTextDocument(onDidChangeTextDocument);

	// Push all disposables
	context.subscriptions.push(
		languageClient.start(),

		diagnosticCollection,

		// Commands
		commandCompile,
		commandCompileLocal,

		// Output channels
		VSC.Disposable.from(outputChannel)
	);
}

function onDidChangeTextDocument(ev: VSC.TextDocumentChangeEvent) {
	diagnosticCollection.delete(ev.document.uri);
}


export function deactivate() {

}



