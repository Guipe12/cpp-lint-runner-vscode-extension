"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const childProcess = __importStar(require("child_process"));
let diagnosticCollection;
function activate(context) {
    diagnosticCollection = vscode.languages.createDiagnosticCollection("cpplint");
    context.subscriptions.push(diagnosticCollection);
    // Function to run the linter on the active file
    const runLinter = (document) => {
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
            let diagnostics = [];
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
        }
        else {
            vscode.window.showInformationMessage("No file is open");
        }
    });
    // Register event listener for file save
    let onSaveEvent = vscode.workspace.onDidSaveTextDocument((document) => {
        if (document.languageId === "cpp") {
            // Optionally, check for C++ files only
            runLinter(document);
        }
    });
    context.subscriptions.push(runLintCommand, onSaveEvent);
}
function deactivate() {
    if (diagnosticCollection) {
        diagnosticCollection.dispose();
    }
}
//# sourceMappingURL=extension.js.map