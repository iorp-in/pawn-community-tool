import * as vscode from 'vscode';
import { TextDocument, FoldingRange, ProviderResult } from 'vscode';

export default class PawnFoldingProvider implements vscode.FoldingRangeProvider {
    public provideFoldingRanges(document: TextDocument): ProviderResult<FoldingRange[]> {
        return findFoldRanges(document);
    }
}

const start = RegExp(/\/\/\sregion(.*)/gm);
const end = RegExp(/\/\/\sendregion(.*)/gm);
const startComment = RegExp(/^\/\*(.*)/gm);
const endComment = RegExp(/\*\/(.*)/gm);

function findFoldRanges(document: TextDocument) {
    let folds: FoldingRange[] = [];
    let cCustomRegion = false;
    let lastLineBlank = false;
    let foldLineStart: number | null = null;
    for (var i = 0; i < document.lineCount; i++) {
        let line = document.lineAt(i).text.trim();
        if (i === 0 && line.length > 0) lastLineBlank = true, foldLineStart = i;
        if (!line) {
            if (foldLineStart !== null && !cCustomRegion) {
                folds.push(new FoldingRange(foldLineStart, i - 1));
                foldLineStart = null;
            }
            lastLineBlank = true;
            continue;
        } else {
            if (lastLineBlank && foldLineStart === null) {
                if (line.length > 0) {
                    if (start.test(line) || (startComment.test(line) && !endComment.test(line))) cCustomRegion = true;
                    foldLineStart = i;
                }
            }
            if (cCustomRegion && foldLineStart !== null && (end.test(line) || endComment.test(line))) {
                folds.push(new FoldingRange(foldLineStart, i - 1));
                foldLineStart = null;
                cCustomRegion = false;
            }
            lastLineBlank = false;
        }
    }
    return folds;
}