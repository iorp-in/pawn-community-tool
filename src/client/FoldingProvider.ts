import * as vscode from 'vscode';
import { TextDocument, FoldingRange, ProviderResult } from 'vscode';

export default class PawnFoldingProvider implements vscode.FoldingRangeProvider {
    public provideFoldingRanges(document: TextDocument): ProviderResult<FoldingRange[]> {
        return findFoldRanges(document);
    }
}

const start = RegExp(/\/\/\sregion(.*)/gm);
const end = RegExp(/\/\/\sendregion(.*)/gm);

function findFoldRanges(document: TextDocument) {
    let folds: FoldingRange[] = [];
    let cCustomRegion = false;
    let lastLineBlank = true;
    let foldLineStart: number | null = 1;
    for (var i = 0; i < document.lineCount; i++) {
        let line = document.lineAt(i).text.trim();
        if (!line) {
            if (foldLineStart && !cCustomRegion) {
                folds.push(new FoldingRange(foldLineStart, i - 1));
                foldLineStart = null;
            }
            lastLineBlank = true;
            continue;
        } else {
            if (lastLineBlank && !foldLineStart) {
                if (line.length > 0) {
                    if (start.test(line)) cCustomRegion = true;
                    foldLineStart = i;
                }
            }
            if (cCustomRegion && end.test(line) && foldLineStart) {
                folds.push(new FoldingRange(foldLineStart, i - 1));
                foldLineStart = null;
                cCustomRegion = false;
            }
            lastLineBlank = false;
        }
    }
    return folds;
}