import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "auto-fold" is now active!');

  // Track documents that have been folded (by URI string). Reset on each VS Code startup.
  const foldedDocs = new Set<string>();

  // Track documents that have been opened (and folding attempted). 
  // Used to avoid repeated folding attempts when switching editors.
  const openedDocs = new Set<string>();

  // Prevent concurrent folding on same document: store ongoing folding Promises
  const foldingPromises = new Map<string, Promise<void>>();

  // Get configured fold levels as number array (range 1..7).
  // Config key `autoFold.foldLevelOnOpen` expects number[] (e.g. [2,4,1]).
  // Values <= 0 are ignored. Provides fallback for single number config.
  function getConfiguredFoldLevels(): number[] {
    const cfg = vscode.workspace.getConfiguration('autoFold');
    const raw = cfg.get<any>('foldLevelOnOpen', [1]);
    let arr: any[] = [];
    if (Array.isArray(raw)) {
      arr = raw;
    } else if (typeof raw === 'number') {
      // Fallback: single number -> convert to array
      arr = [raw];
    } else {
      // Unknown type, fallback to default
      arr = [1];
    }

    // Normalize: convert to integers, limit to 0..7, keep only >0 values (0 disables folding)
    const levels: number[] = arr
      .map((v) => {
        const n = typeof v === 'number' ? Math.floor(v) : NaN;
        if (Number.isNaN(n)) {
          return -1;
        }
        return Math.max(0, Math.min(7, n));
      })
      .filter((n) => n > 0);

    console.log('auto-fold: configured fold levels ->', levels);
    return levels;
  }

  function getOpenDelayMs(): number {
    const cfg = vscode.workspace.getConfiguration('autoFold');
    const n = cfg.get<number>('openDelayMs', 300);
    if (typeof n !== 'number' || Number.isNaN(n) || n < 0) {
      return 300;
    }
    return Math.min(5000, Math.floor(n));
  }

  async function applyFoldToEditor(editor: vscode.TextEditor | undefined) {
    if (!editor) {
      return;
    }
    // Mark document as seen to prevent other handlers from attempting to fold
    try {
      openedDocs.add(editor.document.uri.toString());
    } catch (_) {
      // ignore
    }
    // Skip if document already folded to avoid repeated execution when switching editors.
    // Use URI string as key.
    const uriKey = editor.document.uri.toString();
    if (foldedDocs.has(uriKey)) {
      console.log(`auto-fold: already applied to ${editor.document.uri.fsPath}, skipping`);
      return;
    }

    // If folding task is ongoing, wait for completion and return to avoid concurrent execution
    if (foldingPromises.has(uriKey)) {
      try {
        await foldingPromises.get(uriKey);
      } catch (e) {
        // Previous task failed: continue with current folding attempt (logic will re-register)
      }
      return;
    }

    // Register placeholder Promise to prevent concurrent triggering
    let resolveFn!: () => void;
    let rejectFn!: (err?: any) => void;
    const foldingPromise = new Promise<void>((resolve, reject) => {
      resolveFn = resolve;
      rejectFn = reject;
    });
    foldingPromises.set(uriKey, foldingPromise);
    const levels = getConfiguredFoldLevels();
    if (!levels || levels.length === 0) {
      console.log(`auto-fold: automatic folding disabled (no configured levels)`);
      return;
    }
    try {
      // Ensure target editor is active. Many built-in commands only work on active editor,
      // so make target editor visible and active.
      let targetEditor = editor;
      // Save current active editor to restore after folding.
      const previousActive = vscode.window.activeTextEditor;
      try {
        // Show target editor without focus first (smoother UX)
        await vscode.window.showTextDocument(editor.document, { viewColumn: editor.viewColumn, preserveFocus: true });
        // Then temporarily activate it so built-in folding commands can work on it.
        const activated = await vscode.window.showTextDocument(editor.document, {
          viewColumn: editor.viewColumn,
          preserveFocus: false,
        });
        if (activated) {
          targetEditor = activated;
        }
      } catch (e) {
        // If showTextDocument fails, fallback to original editor.
        console.error('auto-fold: showTextDocument failed', e);
      }

      const all = await vscode.commands.getCommands(true);
      for (const level of levels) {
        const cmd = `editor.foldLevel${level}`;
        if (!all.includes(cmd)) {
          console.log(`auto-fold: command ${cmd} not available, skipping`);
          continue;
        }
        try {
          // Built-in foldLevel commands work on active editor, so ensure they target current active editor.
          await vscode.commands.executeCommand(cmd);
          console.log(`auto-fold: executed ${cmd} for ${targetEditor.document.uri.fsPath}`);
        } catch (e) {
          console.error(`auto-fold: failed to execute ${cmd}`, e);
        }
      }

      // Mark document as folded
      foldedDocs.add(uriKey);
      // Resolve registered foldingPromise
      try {
        resolveFn();
      } catch (e) {
        // ignore
      }

      // Restore previous active editor to avoid stealing focus long-term.
      try {
        if (previousActive && previousActive.document.uri.toString() !== editor.document.uri.toString()) {
          await vscode.window.showTextDocument(previousActive.document, {
            viewColumn: previousActive.viewColumn,
            preserveFocus: true,
          });
        }
      } catch (e) {
        console.error('auto-fold: failed to restore previous active editor', e);
      }
    } catch (e) {
      // On failure, reject and remove from foldedDocs (ensures retry next time)
      rejectFn && rejectFn(e);
      foldedDocs.delete(uriKey);
      console.error('auto-fold: failed to execute fold commands', e);
    } finally {
      foldingPromises.delete(uriKey);
    }
  }

  // Apply folding when new text document is opened (may not have editor yet).
  // Wait briefly, then find TextEditor matching opened document,
  // apply folding only to that editor to avoid repeated execution when switching.
  const openDisposable = vscode.workspace.onDidOpenTextDocument(async (document) => {
    console.log(`onDidOpenTextDocument: ${document.uri.fsPath}`);
    // Mark document as seen to skip folding attempts when switching editors later
    const uriKey = document.uri.toString();
    if (!openedDocs.has(uriKey)) {
      openedDocs.add(uriKey);
      console.log(`auto-fold: recorded opened document ${document.uri.fsPath}`);
    }

    // Small delay to wait for editor availability (configurable via autoFold.openDelayMs)
    // Increase slightly to improve chance editor is created when we check.
    setTimeout(() => {
      // Try to find matching editor among visible editors first
      const editor = vscode.window.visibleTextEditors.find(
        (e) => e.document.uri.path.toString() === document.uri.toString(),
      );
      if (editor) {
        void applyFoldToEditor(editor);
        return;
      }
      // Fallback: use active editor if it matches document
      const active = vscode.window.activeTextEditor;
      if (active && active.document.uri.toString() === document.uri.toString()) {
        void applyFoldToEditor(active);
        return;
      }
      // No editor found for document yet; do nothing.
      console.log(`auto-fold: no editor available yet for ${document.uri.fsPath}`);
    }, getOpenDelayMs());
  });
  context.subscriptions.push(openDisposable);

  // Apply folding when active editor changes (e.g. via command or user click)
  const activeDisposable = vscode.window.onDidChangeActiveTextEditor((editor) => {
    // When switching active editor, skip folding if document was seen before (to avoid repeats).
    // Otherwise attempt folding and mark as seen.
    if (!editor) {
      return;
    }
    const uriKeyActive = editor.document.uri.toString();
    if (openedDocs.has(uriKeyActive)) {
      console.log(`auto-fold: active document ${editor.document.uri.fsPath} was seen before, skipping fold`);
      return;
    }
    // Mark as seen and attempt folding
    openedDocs.add(uriKeyActive);
    console.log(`auto-fold: recorded and attempting fold for active document ${editor.document.uri.fsPath}`);
    void applyFoldToEditor(editor);
  });
  context.subscriptions.push(activeDisposable);

  // Respond to configuration changes
  const configDisposable = vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration('autoFold.foldLevelOnOpen')) {
      console.log('auto-fold: foldLevelOnOpen changed, applying to active editor');
      applyFoldToEditor(vscode.window.activeTextEditor);
    }
  });
  context.subscriptions.push(configDisposable);

  // Debug command: list editor.foldLevel* commands and potential contributors
  const listFoldDisposable = vscode.commands.registerCommand('auto-fold.listFoldCommands', async () => {
    const all = await vscode.commands.getCommands(true);
    const foldCmds = all.filter((c) => /editor\.foldLevel\d+/.test(c));
    console.log('auto-fold.listFoldCommands: found fold commands ->', foldCmds);
    // Search for contributes.commands entries in installed extensions
    const contributors: Array<{ command: string; extensionId: string }> = [];
    for (const ext of vscode.extensions.all) {
      try {
        const contributes = ext.packageJSON && ext.packageJSON.contributes && ext.packageJSON.contributes.commands;
        if (Array.isArray(contributes)) {
          for (const c of contributes) {
            if (c && c.command && /editor\.foldLevel\d+/.test(c.command)) {
              contributors.push({ command: c.command, extensionId: ext.id });
            }
          }
        }
      } catch (e) {
        // Ignore malformed packageJSON in other extensions
      }
    }
    console.log('auto-fold.listFoldCommands: contributors ->', contributors);
    if (foldCmds.length === 0 && contributors.length === 0) {
      vscode.window.showInformationMessage('No editor.foldLevel* commands or contributors found.');
    } else {
      vscode.window.showInformationMessage(
        `Found ${foldCmds.length} fold commands and ${contributors.length} contributors (see Extension Host output).`,
      );
    }
  });

  context.subscriptions.push(listFoldDisposable);
}

// Called when extension is deactivated
export function deactivate() {}