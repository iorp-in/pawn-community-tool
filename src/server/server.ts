import {
    createConnection, TextDocuments, ProposedFeatures, CompletionItem, TextDocumentPositionParams, TextDocumentSyncKind,
    Hover, DefinitionParams, SignatureHelpParams, SignatureHelp, CompletionList, CompletionParams, WorkspaceFolder
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';
import { parseSnippets, doCompletion, doCompletionResolve, doGoToDef, doHover, doSignHelp, resetAutocompletes } from './parser';

let connection = createConnection(ProposedFeatures.all);
let documents = new TextDocuments(TextDocument);
export let openedWorkspaceList: WorkspaceFolder[] = [];
documents.listen(connection);
connection.listen();

connection.onInitialize((InitializeParams) => {
    if (InitializeParams.workspaceFolders !== null) openedWorkspaceList = openedWorkspaceList.concat(InitializeParams.workspaceFolders);

    return {
        capabilities: {
            textDocumentSync: TextDocumentSyncKind.Full,
            // Tell the client that the server supports code completion
            completionProvider: {
                resolveProvider: true
            },
            definitionProvider: true,
            hoverProvider: true,
            signatureHelpProvider: {
                triggerCharacters: ['(', ',']
            },
            workspace: {
                workspaceFolders: {
                    supported: true
                }
            }
        }
    };
});

connection.onInitialized(() => {
    connection.workspace.onDidChangeWorkspaceFolders(_event => {
        openedWorkspaceList = openedWorkspaceList.concat(_event.added);
        _event.removed.forEach(ws => { openedWorkspaceList = openedWorkspaceList.filter(res => res.uri !== ws.uri); });
    });
});

connection.onNotification("revalidateAllOpenedDocuments", () => {
    resetAutocompletes();
    documents.all().forEach(parseSnippets);
});

connection.onDidChangeConfiguration(() => {
    documents.all().forEach(parseSnippets);
});

documents.onDidClose(() => {
});

documents.onDidChangeContent(change => {
    parseSnippets(change.document);
});

connection.onDidChangeWatchedFiles(_change => {
});

connection.onDefinition((textDocumentIdentifier: DefinitionParams) => {
    const doc = documents.get(textDocumentIdentifier.textDocument.uri);
    if (doc === undefined) return;
    return doGoToDef(doc, textDocumentIdentifier.position);
});

connection.onHover((params: TextDocumentPositionParams): Hover | undefined => {
    const doc = documents.get(params.textDocument.uri);
    if (doc === undefined) return;
    return doHover(doc, params.position);
});

connection.onSignatureHelp((params: SignatureHelpParams): SignatureHelp | undefined => {
    const doc = documents.get(params.textDocument.uri);
    if (doc === undefined) return;
    return doSignHelp(doc, params.position);
});

connection.onCompletion(async (params: CompletionParams) => {
    const c: CompletionList = { isIncomplete: false, items: await doCompletion(params) };
    return c;
});

connection.onCompletionResolve(
    async (item: CompletionItem): Promise<CompletionItem> => {
        return await doCompletionResolve(item);
    }
);
