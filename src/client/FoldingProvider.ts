import * as vscode from 'vscode';
import { TextDocument, FoldingRange, ProviderResult } from 'vscode';

export default class PawnFoldingProvider implements vscode.FoldingRangeProvider {
    public provideFoldingRanges(document: TextDocument): ProviderResult<FoldingRange[]> {
        return findFoldRanges(document);
    }
}

const start = RegExp(/^\/\/\sregion(.*)/gm); // code 1
const end = RegExp(/^\/\/\sendregion(.*)/gm); // code 1
const startComment = RegExp(/^\/\*(.*)/gm); // code 2
const endComment = RegExp(/\*\/(.*)/gm); // code 2

function findFoldRanges(document: TextDocument) {
    let folds: FoldingRange[] = [];
    let cCustomRegionCode = 0;
    let bracketRegion = 0;
    let bracketRegionCollect: number[] = [];
    let lastLineBlank = false;
    let foldLineStart: number | null = null;
    for (var i = 0; i < document.lineCount; i++) {
        let line = document.lineAt(i).text;
        if (i === 0 && line.length > 0) lastLineBlank = true, foldLineStart = i;
        if (line.length > 0) {
            for (let index = 0; index < line.length; index++) {
                const element = line[index];
                if (element === "{") {
                    bracketRegion++;
                    bracketRegionCollect.push(i);
                }
                if (element === "}") {
                    bracketRegion--;
                    const startN = bracketRegionCollect.pop();
                    if (startN !== undefined) {
                        if (startN < i) {
                            folds.push(new FoldingRange(startN, i));
                        }
                    }
                }
            }
        }
        if (bracketRegion === 0) {
            if (!line) {
                if (foldLineStart !== null && cCustomRegionCode === 0) {
                    folds.push(new FoldingRange(foldLineStart, i - 1));
                    foldLineStart = null;
                }
                lastLineBlank = true;
                continue;
            } else {
                if (lastLineBlank && foldLineStart === null) {
                    if (line.length > 0) {
                        if (cCustomRegionCode === 0 && start.test(line)) cCustomRegionCode = 1;
                        if (cCustomRegionCode === 0 && startComment.test(line) && !endComment.test(line)) cCustomRegionCode = 2;
                        foldLineStart = i;
                    }
                }
                if (foldLineStart !== null && ((cCustomRegionCode === 1 && end.test(line)) || (cCustomRegionCode === 2 && endComment.test(line)))) {
                    folds.push(new FoldingRange(foldLineStart, i - 1));
                    foldLineStart = null;
                    cCustomRegionCode = 0;
                }
                lastLineBlank = false;
            }
        }
    }
    return folds;
}