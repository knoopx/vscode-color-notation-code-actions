"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ColorNotationProvider = exports.activate = void 0;
const vscode = require("vscode");
const notations_1 = require("./notations");
let matches = [];
function activate(context) {
    subscribeToDocumentChanges(context);
    context.subscriptions.push(vscode.languages.registerCodeActionsProvider("*", new ColorNotationProvider(), {
        providedCodeActionKinds: ColorNotationProvider.providedCodeActionKinds,
    }));
}
exports.activate = activate;
function matchNotation(notation, text) {
    let results = [];
    let match = notation.regex.exec(text);
    while (match !== null) {
        results.push({
            notation,
            match,
            range: [match.index, notation.regex.lastIndex],
        });
        match = notation.regex.exec(text);
    }
    return results;
}
function matchColors(doc) {
    return notations_1.NOTATIONS.map((notation) => matchNotation(notation, doc.getText())).flatMap((x) => x);
}
function subscribeToDocumentChanges(context) {
    if (vscode.window.activeTextEditor) {
        matches = matchColors(vscode.window.activeTextEditor.document);
    }
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor) {
            matches = matchColors(editor.document);
        }
    }));
    context.subscriptions.push(vscode.workspace.onDidChangeTextDocument((e) => {
        matches = matchColors(e.document);
    }));
}
class ColorNotationProvider {
    provideCodeActions(document, range, context, token) {
        return matches.flatMap((match) => {
            const [start, end] = match.range.map(document.positionAt);
            const matchRange = new vscode.Range(start, end);
            if (!matchRange.contains(range)) {
                return;
            }
            const [r, g, b, a = 255] = match.notation.parse(match.match);
            const targets = new Set(notations_1.NOTATIONS.filter((notation) => notation !== match.notation).map((targetNotation) => targetNotation.format(r, g, b, a)));
            return Array.from(targets)
                .sort()
                .map((targetValue) => {
                return this.buildQuickFix(targetValue, document, matchRange);
            });
        });
    }
    buildQuickFix(targetValue, document, matchRange) {
        const fix = new vscode.CodeAction(`Convert to ${targetValue}`, vscode.CodeActionKind.QuickFix);
        fix.edit = new vscode.WorkspaceEdit();
        fix.edit.replace(document.uri, matchRange, targetValue);
        return fix;
    }
}
exports.ColorNotationProvider = ColorNotationProvider;
ColorNotationProvider.providedCodeActionKinds = [
    vscode.CodeActionKind.QuickFix,
];
