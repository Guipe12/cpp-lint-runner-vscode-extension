import * as vscode from "vscode";
import * as childProcess from "child_process";

let diagnosticCollection: vscode.DiagnosticCollection;

export function activate(context: vscode.ExtensionContext) {
    diagnosticCollection = vscode.languages.createDiagnosticCollection("cpplint");
    context.subscriptions.push(diagnosticCollection);

    // Function to run the linter on the active file
    const runLinter = (document: vscode.TextDocument) => {
        let filePath = document.fileName;

        diagnosticCollection.delete(document.uri);
        diagnosticCollection.clear();

        // Run cpplinter on the file
        childProcess.exec(`cpplinter ${filePath}`, (error, stdout, stderr) => {
            if (error) {
                vscode.window.showErrorMessage(stderr);
                return;
            }

            // Display the output as warnings
            let diagnostics: vscode.Diagnostic[] = [];
            stdout.split("\n").forEach((line) => {
                let match = line.match(/Line (\d+): (.+)/);
                if (match) {
                    let lineNumber = parseInt(match[1], 10) - 1;
                    let message = match[2];
                    let range = new vscode.Range(new vscode.Position(lineNumber, 0), new vscode.Position(lineNumber, document.lineAt(lineNumber).text.length));
                    let diagnostic = new vscode.Diagnostic(range, message, vscode.DiagnosticSeverity.Warning);
                    diagnostics.push(diagnostic);
                }
            });
            diagnosticCollection.set(document.uri, diagnostics);
        });
    };

    // Register command to run linter manually
    let runLintCommand = vscode.commands.registerCommand("cpplint.runLint", () => {
        let editor = vscode.window.activeTextEditor;
        if (editor) {
            runLinter(editor.document);
        } else {
            vscode.window.showInformationMessage("No file is open");
        }
    });

    // Register event listener for file save
    let onSaveEvent = vscode.workspace.onDidSaveTextDocument((document: vscode.TextDocument) => {
        if (document.languageId === "cpp") {
            // Optionally, check for C++ files only
            runLinter(document);
        }
    });

    context.subscriptions.push(runLintCommand, onSaveEvent);
}

export function deactivate() {
    if (diagnosticCollection) {
        diagnosticCollection.dispose();
    }
}
