import * as FS from 'fs';
import * as Path from 'path';
import * as CP from 'child_process';
import * as VSC from 'vscode';
import * as Settings from '../common/settings-types';
import * as Helpers from '../common/helpers';

interface OutputDiagnostic {
    // 'warning' | 'error'
    type: string;

    startLine: number;
    endLine?: number;

    message: string;
}

class OutputData {
    public diagnostics: OutputDiagnostic[];

    public constructor() {
        this.diagnostics = [];
    }
}


function doCompile(executablePath: string, inputPath: string, compilerSettings: Settings.CompilerSettings, outputChannel: VSC.OutputChannel, diagnosticCollection: VSC.DiagnosticCollection) {
    diagnosticCollection.clear();

    let outputPath = '';
    if (compilerSettings.outputType === 'path') {
        outputPath = Helpers.resolvePathVariables(compilerSettings.outputPath, String(VSC.workspace.rootPath), inputPath);
        if (!FS.existsSync(outputPath)) {
            outputChannel.appendLine(`Path ${outputPath} doesn't exist. Compilation aborted.`);
            return;
        }
        outputPath = Path.join(outputPath, Path.basename(inputPath, Path.extname(inputPath)) + '.amxx');
    } else if (compilerSettings.outputType === 'source') {
        outputPath = Path.join(Path.dirname(inputPath), Path.basename(inputPath, Path.extname(inputPath)) + '.amxx');
    } else if (compilerSettings.outputType === 'plugins') {
        // Unfinished
    } else {
        outputChannel.appendLine('\'pawncc.compiler.outputType\' setting has an invalid value.');
        return;
    }

    const compilerArgs: string[] = [
        inputPath,
        ...compilerSettings.options,
        ...compilerSettings.includePaths.map((path) => `-i${Helpers.resolvePathVariables(path, String(VSC.workspace.rootPath), inputPath)}`),
        `-o${outputPath}`
    ];
    const spawnOptions: CP.SpawnOptions = {
        env: process.env,
        cwd: Path.dirname(executablePath)
    };

    if (compilerSettings.showInfoMessages === true) {
        outputChannel.appendLine(`Starting pawncc: ${executablePath} ${compilerArgs.join(' ')}\n`);
    }

    let compilerStdout = '';

    const pawnccProcess = CP.spawn(executablePath, compilerArgs, spawnOptions);

    if (pawnccProcess.stdout !== null) pawnccProcess.stdout.on('data', (data) => {
        const textData = (data instanceof Buffer) ? data.toString() : data as string;

        if (compilerSettings.reformatOutput === false) {
            outputChannel.append(textData);
        } else {
            compilerStdout += textData;
        }
    });

    if (pawnccProcess.stderr !== null) pawnccProcess.stderr.on('data', (data) => {
        const textData = (data instanceof Buffer) ? data.toString() : data as string;
        outputChannel.append('stderr: ' + data as string);
    });

    pawnccProcess.on('error', (err) => {
        outputChannel.appendLine(`Failed to start pawncc: ${err.message}`);
    });

    pawnccProcess.on('close', (exitCode) => {
        if (compilerSettings.reformatOutput === true) {
            const outputData = new Map<string, OutputData>();

            // Group 1 - filename
            // Group 2 - beginning line
            // Group 3 - ending line (optional)
            // Group 4 - error | warning
            // Group 5 - message
            const captureOutputRegex = /(.+?)\((\d+)(?:\s--\s(\d+))?\)\s:\s(warning|error)\s\d+:\s(.*)/g;
            let results: RegExpExecArray | null = captureOutputRegex.exec(compilerStdout);

            while (results !== null) {
                let data = outputData.get(results[1]);
                if (data === undefined) {
                    data = new OutputData();
                    outputData.set(results[1], data);
                }

                data.diagnostics.push({
                    type: results[4],
                    message: results[5],
                    startLine: Number.parseInt(results[2], 10),
                    endLine: results[3] !== undefined ? Number.parseInt(results[3], 10) : undefined
                });
            }

            if (/Done\./.test(compilerStdout) === true) {
                let outputFilePath = '';
                if (VSC.workspace.rootPath !== undefined) {
                    const relativePath = Path.relative(VSC.workspace.rootPath, outputPath);
                    if (!relativePath.startsWith('../')) {
                        outputFilePath = relativePath;
                    }
                }

                outputChannel.appendLine('Success');
                outputChannel.appendLine('Output: ' + outputFilePath + '\n');
            }

            for (const data of outputData) {
                let filePath = data[0];
                const diagnostics = data[1].diagnostics;
                const resourceDiagnostics: VSC.Diagnostic[] = [];

                if (VSC.workspace.rootPath !== undefined) {
                    const relativePath = Path.relative(VSC.workspace.rootPath, filePath);
                    if (!relativePath.startsWith('../')) {
                        filePath = relativePath;
                    }
                }

                outputChannel.appendLine(`===== ${filePath} =====`);
                diagnostics.filter((diag) => diag.type === 'warning').forEach((diag) => {
                    outputChannel.appendLine(`WARNING [${diag.startLine}${diag.endLine !== undefined ? ` -- ${diag.endLine}` : ''}]: ${diag.message}`);

                    const range = new VSC.Range(diag.startLine - 1, 0, (diag.endLine !== undefined ? diag.endLine : diag.startLine) - 1, Number.MAX_VALUE);
                    resourceDiagnostics.push(new VSC.Diagnostic(range, `WARNING: ${diag.message}`, VSC.DiagnosticSeverity.Warning));
                });
                diagnostics.filter((diag) => diag.type === 'error').forEach((diag) => {
                    outputChannel.appendLine(`ERROR [${diag.startLine}${diag.endLine !== undefined ? ` -- ${diag.endLine}` : ''}]: ${diag.message}`);

                    const range = new VSC.Range(diag.startLine - 1, 0, (diag.endLine !== undefined ? diag.endLine : diag.startLine) - 1, Number.MAX_VALUE);
                    resourceDiagnostics.push(new VSC.Diagnostic(range, `ERROR: ${diag.message}`, VSC.DiagnosticSeverity.Error));
                });

                diagnosticCollection.set(VSC.Uri.file(data[0]), resourceDiagnostics);
                outputChannel.append('\n');
            }
        }

        if (compilerSettings.showInfoMessages === true) {
            outputChannel.appendLine(`\npawncc exited with code ${exitCode}.`);
        }
    });
}

export function compile(outputChannel: VSC.OutputChannel, diagnosticCollection: VSC.DiagnosticCollection) {
    outputChannel.clear();

    const compilerSettings = VSC.workspace.getConfiguration('pawn').get('compiler') as Settings.CompilerSettings;
    if (compilerSettings.switchToOutput === true) {
        outputChannel.show();
    }

    const editor = VSC.window.activeTextEditor;
    if (editor === undefined) {
        outputChannel.appendLine('No active window with Pawn code.');
        return;
    }
    if (editor.document.uri.scheme !== 'file') {
        outputChannel.appendLine('The input file is not a file on the disk.');
        return;
    }
    const inputPath = editor.document.uri.fsPath;
    const executablePath = Helpers.resolvePathVariables(compilerSettings.executablePath, String(VSC.workspace.rootPath), inputPath);

    FS.access(executablePath, FS.constants.X_OK, (err) => {
        if (err) {
            outputChannel.appendLine('Can\'t access pawncc. Please check if the path is correct and if you have permissions to execute pawncc.');
            return;
        }

        if (editor.document.isDirty === false) {
            doCompile(executablePath, inputPath, compilerSettings, outputChannel, diagnosticCollection);
            return;
        }

        editor.document.save()
            .then((isSuccess) => {
                if (isSuccess === false) {
                    outputChannel.appendLine('File save failed.');
                    return;
                }

                doCompile(executablePath, inputPath, compilerSettings, outputChannel, diagnosticCollection);
            });
    });
}

export function compileLocal(outputChannel: VSC.OutputChannel, diagnosticCollection: VSC.DiagnosticCollection) {
    outputChannel.clear();

    const compilerSettings = VSC.workspace.getConfiguration('pawn').get('compiler') as Settings.CompilerSettings;
    if (compilerSettings.switchToOutput === true) {
        outputChannel.show();
    }

    const editor = VSC.window.activeTextEditor;
    if (editor === undefined) {
        outputChannel.appendLine('No active window with Pawn code.');
        return;
    }
    if (editor.document.uri.scheme !== 'file') {
        outputChannel.appendLine('The input file is not a file on the disk.');
        return;
    }
    const inputPath = editor.document.uri.fsPath;

    const executableDir = Path.dirname(inputPath);
    FS.readdir(executableDir, (err, files) => {
        if (err) {
            throw err;
        }

        const potentialFiles = files.filter((file) => file.substring(0, 6) === 'pawncc');
        let executablePath: string;

        // Check specifically for 'pawncc.exe', resulting in no ambiguity
        const pawnccExeIndex = potentialFiles.indexOf('pawncc.exe');
        if (pawnccExeIndex >= 0) {
            executablePath = Path.join(executableDir, potentialFiles[pawnccExeIndex]);
        } else {
            if (potentialFiles.length === 0) {
                outputChannel.appendLine(`There are no files starting with 'pawncc' in '${executableDir}'. Failed detecting pawncc executable.`);
                return;
            }
            if (potentialFiles.length > 1) {
                outputChannel.appendLine(`Ambiguous result: there is more than 1 file in '${executableDir}' starting with 'pawncc'. Failed detecting pawncc executable.`);
                return;
            }
            executablePath = Path.join(executableDir, potentialFiles[0]);
        }

        FS.access(executablePath, FS.constants.X_OK, (err) => {
            if (err) {
                outputChannel.appendLine('Can\'t access pawncc. Please check if you have permissions to execute pawncc.');
                return;
            }

            doCompile(Path.join(executableDir, potentialFiles[0]), inputPath, compilerSettings, outputChannel, diagnosticCollection);
        });
    });
}
