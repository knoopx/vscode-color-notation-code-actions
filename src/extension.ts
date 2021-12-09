import * as vscode from "vscode";
import { Match, NOTATIONS, matchColors } from "./notations";

let matches: Match[] = [];

export function activate(context: vscode.ExtensionContext) {
  subscribeToDocumentChanges(context);

  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      { scheme: "file", pattern: "**" },
      new ColorNotationProvider(),
      {
        providedCodeActionKinds: ColorNotationProvider.providedCodeActionKinds,
      }
    )
  );
}

function subscribeToDocumentChanges(context: vscode.ExtensionContext): void {
  if (vscode.window.activeTextEditor) {
    matches = matchColors(vscode.window.activeTextEditor.document.getText());
  }
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor) {
        matches = matchColors(editor.document.getText());
      }
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((e) => {
      matches = matchColors(e.document.getText());
    })
  );
}

export class ColorNotationProvider implements vscode.CodeActionProvider {
  public static readonly providedCodeActionKinds = [
    vscode.CodeActionKind.QuickFix,
  ];

  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext,
    token: vscode.CancellationToken
  ): vscode.CodeAction[] {
    return matches.flatMap((match) => {
      const [start, end] = match.range.map(document.positionAt);
      const matchRange = new vscode.Range(start, end);

      if (!matchRange.contains(range)) {
        return;
      }

      const [r, g, b, a = 255] = match.notation.parse(match.match);
      const targets = new Set(
        NOTATIONS.filter((notation) => notation !== match.notation).map(
          (targetNotation) => targetNotation.format(r, g, b, a)
        )
      );

      return Array.from(targets)
        .sort()
        .map((targetValue) => {
          return this.buildQuickFix(targetValue, document, matchRange);
        });
    });
  }

  private buildQuickFix(
    value: string,
    document: vscode.TextDocument,
    matchRange: vscode.Range
  ) {
    const fix = new vscode.CodeAction(
      `Convert to ${value}`,
      vscode.CodeActionKind.QuickFix
    );
    fix.edit = new vscode.WorkspaceEdit();
    fix.edit.replace(document.uri, matchRange, value);
    return fix;
  }
}
