import * as vscode from 'vscode';
import { TextDocument, FoldingRange, ProviderResult } from 'vscode';

export default class PawnFoldingProvider implements vscode.FoldingRangeProvider {
    public provideFoldingRanges(document: TextDocument): ProviderResult<FoldingRange[]> {
        return findFoldRanges(document);
    }
}

function findFoldRanges(document: TextDocument) {
    const startRegEx = vscode.workspace.getConfiguration().get('pawn.language.startRegion') as string | null;
    const endRegEx = vscode.workspace.getConfiguration().get('pawn.language.endRegion') as string | null;
    let showLastLineOfRegion = vscode.workspace.getConfiguration().get('pawn.language.showLastLineOfRegion') as true | false | null;
    if (showLastLineOfRegion === null) showLastLineOfRegion = true;

    const start = RegExp(startRegEx !== null ? startRegEx : /(\/\/#region)|(\/\*)|\{/gm); // code 1
    const end = RegExp(endRegEx !== null ? endRegEx : /(\/\/#endregion)|(\*\/)|\}/gm); // code 1

    let folds: FoldingRange[] = [];
    let customRegionCollect: number[] = [];
    for (var i = 0; i < document.lineCount; i++) {
        let line = document.lineAt(i).text;
        if (start.test(line)) {
            customRegionCollect.push(i);
        }
        if (end.test(line)) {
            const startN = customRegionCollect.pop();
            if (startN !== undefined) {
                if (startN < i && startN - 1 !== i) {
                    folds.push(new FoldingRange(startN, showLastLineOfRegion ? i - 1 : i));
                }
            }
        }
    }
    return folds;
}