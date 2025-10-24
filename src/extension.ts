import * as vscode from 'vscode'

// Constants
const FOLD_LEVEL_MIN = 1
const FOLD_LEVEL_MAX = 7
const DEFAULT_OPEN_DELAY = 300
const MAX_OPEN_DELAY = 5000

// Type definitions
interface AutoFoldConfig {
  foldLevelOnOpen: number | number[]
  openDelayMs: number
}

interface FoldingPromise {
  resolve: () => void
  reject: (err?: any) => void
}

// Logger utility
const logger = {
  info: (message: string, ...args: any[]) => {
    console.log(`[auto-fold] ${message}`, ...args)
  },
  error: (message: string, error?: any) => {
    console.error(`[auto-fold] ${message}`, error)
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(`[auto-fold] ${message}`, ...args)
  },
}

export function activate(context: vscode.ExtensionContext) {
  logger.info('Extension activated')

  // Track documents that have been folded (by URI string). Reset on each VS Code startup.
  const foldedDocs = new Set<string>()

  // Track documents that have been opened (and folding attempted).
  // Used to avoid repeated folding attempts when switching editors.
  const openedDocs = new Set<string>()

  // Prevent concurrent folding on same document: store ongoing folding Promises
  const foldingPromises = new Map<string, Promise<void>>()

  // Get configured fold levels as number array (range 1..7).
  // Config key `autoFold.foldLevelOnOpen` expects number[] (e.g. [2,4,1]).
  // Values <= 0 are ignored. Provides fallback for single number config.
  function getConfiguredFoldLevels(): number[] {
    const cfg = vscode.workspace.getConfiguration('autoFold')
    const raw = cfg.get<number | number[]>('foldLevelOnOpen', [1])
    let arr: number[] = []

    if (Array.isArray(raw)) {
      arr = raw
    } else if (typeof raw === 'number') {
      // Fallback: single number -> convert to array
      arr = [raw]
    } else {
      // Unknown type, fallback to default
      arr = [1]
    }

    // Normalize: convert to integers, limit to 0..7, keep only >0 values (0 disables folding)
    const levels: number[] = arr
      .map((v) => {
        const n = typeof v === 'number' ? Math.floor(v) : NaN
        if (Number.isNaN(n)) {
          return -1
        }
        return Math.max(0, Math.min(FOLD_LEVEL_MAX, n))
      })
      .filter((n) => n > 0)

    logger.info('Configured fold levels ->', levels)
    return levels
  }

  function getOpenDelayMs(): number {
    const cfg = vscode.workspace.getConfiguration('autoFold')
    const n = cfg.get<number>('openDelayMs', DEFAULT_OPEN_DELAY)
    if (typeof n !== 'number' || Number.isNaN(n) || n < 0) {
      return DEFAULT_OPEN_DELAY
    }
    return Math.min(MAX_OPEN_DELAY, Math.floor(n))
  }

  // Cache for available fold commands to avoid repeated lookups
  let availableFoldCommands: string[] | null = null

  async function getAvailableFoldCommands(): Promise<string[]> {
    if (availableFoldCommands) {
      return availableFoldCommands
    }

    const all = await vscode.commands.getCommands(true)
    availableFoldCommands = all.filter((c) => /editor\.foldLevel\d+/.test(c))
    return availableFoldCommands
  }

  async function ensureEditorActive(editor: vscode.TextEditor): Promise<vscode.TextEditor> {
    if (vscode.window.activeTextEditor?.document.uri === editor.document.uri) {
      return vscode.window.activeTextEditor
    }

    try {
      // Show target editor without focus first (smoother UX)
      await vscode.window.showTextDocument(editor.document, {
        viewColumn: editor.viewColumn,
        preserveFocus: true,
      })

      // Then temporarily activate it so built-in folding commands can work on it
      const activated = await vscode.window.showTextDocument(editor.document, {
        viewColumn: editor.viewColumn,
        preserveFocus: false,
      })
      return activated || editor
    } catch (error) {
      logger.error('Failed to activate editor', error)
      return editor
    }
  }

  async function restorePreviousEditor(
    previousActive: vscode.TextEditor | undefined,
    currentEditor: vscode.TextEditor,
  ) {
    if (previousActive && previousActive.document.uri.toString() !== currentEditor.document.uri.toString()) {
      try {
        await vscode.window.showTextDocument(previousActive.document, {
          viewColumn: previousActive.viewColumn,
          preserveFocus: true,
        })
      } catch (error) {
        logger.error('Failed to restore previous active editor', error)
      }
    }
  }

  function shouldSkipFolding(editor: vscode.TextEditor): boolean {
    try {
      openedDocs.add(editor.document.uri.toString())
    } catch (_) {
      // ignore URI conversion errors
    }

    const uriKey = editor.document.uri.toString()
    if (foldedDocs.has(uriKey)) {
      logger.info(`Already applied to ${editor.document.uri.fsPath}, skipping`)
      return true
    }
    return false
  }

  async function performFolding(editor: vscode.TextEditor, levels: number[]): Promise<void> {
    const uriKey = editor.document.uri.toString()

    // Register placeholder Promise to prevent concurrent triggering
    let resolveFn!: () => void
    let rejectFn!: (err?: any) => void
    const foldingPromise = new Promise<void>((resolve, reject) => {
      resolveFn = resolve
      rejectFn = reject
    })
    foldingPromises.set(uriKey, foldingPromise)

    try {
      const targetEditor = await ensureEditorActive(editor)
      const previousActive = vscode.window.activeTextEditor

      const commands = await getAvailableFoldCommands()

      for (const level of levels) {
        const cmd = `editor.foldLevel${level}`
        if (!commands.includes(cmd)) {
          logger.warn(`Command ${cmd} not available, skipping`)
          continue
        }

        try {
          await vscode.commands.executeCommand(cmd)
          logger.info(`Executed ${cmd} for ${targetEditor.document.uri.fsPath}`)
        } catch (error) {
          logger.error(`Failed to execute ${cmd}`, error)
        }
      }

      // Mark document as folded
      foldedDocs.add(uriKey)
      resolveFn()

      // Restore previous active editor
      await restorePreviousEditor(previousActive, editor)
    } catch (error) {
      rejectFn(error)
      foldedDocs.delete(uriKey)
      logger.error('Failed to execute fold commands', error)
    } finally {
      foldingPromises.delete(uriKey)
    }
  }

  async function applyFoldToEditor(editor: vscode.TextEditor | undefined) {
    if (!editor || shouldSkipFolding(editor)) {
      return
    }

    const uriKey = editor.document.uri.toString()

    // If folding task is ongoing, wait for completion and return to avoid concurrent execution
    if (foldingPromises.has(uriKey)) {
      try {
        await foldingPromises.get(uriKey)
      } catch (e) {
        // Previous task failed: continue with current folding attempt (logic will re-register)
      }
      return
    }

    const levels = getConfiguredFoldLevels()
    if (!levels || levels.length === 0) {
      logger.info('Automatic folding disabled (no configured levels)')
      return
    }

    await performFolding(editor, levels)
  }

  // Apply folding when new text document is opened (may not have editor yet).
  // Wait briefly, then find TextEditor matching opened document,
  // apply folding only to that editor to avoid repeated execution when switching.
  const openDisposable = vscode.workspace.onDidOpenTextDocument(async (document) => {
    logger.info(`Document opened: ${document.uri.fsPath}`)

    // Mark document as seen to skip folding attempts when switching editors later
    const uriKey = document.uri.toString()
    if (!openedDocs.has(uriKey)) {
      openedDocs.add(uriKey)
      logger.info(`Recorded opened document ${document.uri.fsPath}`)
    }

    // Small delay to wait for editor availability (configurable via autoFold.openDelayMs)
    setTimeout(() => {
      // Try to find matching editor among visible editors first
      const editor = vscode.window.visibleTextEditors.find(
        (e) => e.document.uri.path.toString() === document.uri.toString(),
      )
      if (editor) {
        void applyFoldToEditor(editor)
        return
      }
      // Fallback: use active editor if it matches document
      const active = vscode.window.activeTextEditor
      if (active && active.document.uri.toString() === document.uri.toString()) {
        void applyFoldToEditor(active)
        return
      }
      // No editor found for document yet; do nothing.
      logger.info(`No editor available yet for ${document.uri.fsPath}`)
    }, getOpenDelayMs())
  })
  context.subscriptions.push(openDisposable)

  // Apply folding when active editor changes (e.g. via command or user click)
  const activeDisposable = vscode.window.onDidChangeActiveTextEditor((editor) => {
    if (!editor) {
      return
    }

    const uriKeyActive = editor.document.uri.toString()
    if (openedDocs.has(uriKeyActive)) {
      logger.info(`Active document ${editor.document.uri.fsPath} was seen before, skipping fold`)
      return
    }

    // Mark as seen and attempt folding
    openedDocs.add(uriKeyActive)
    logger.info(`Recorded and attempting fold for active document ${editor.document.uri.fsPath}`)
    void applyFoldToEditor(editor)
  })
  context.subscriptions.push(activeDisposable)

  // Respond to configuration changes
  const configDisposable = vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration('autoFold.foldLevelOnOpen')) {
      logger.info('foldLevelOnOpen changed, applying to active editor')
      applyFoldToEditor(vscode.window.activeTextEditor)
    }
  })
  context.subscriptions.push(configDisposable)

  // Debug command: list editor.foldLevel* commands and potential contributors
  const listFoldDisposable = vscode.commands.registerCommand('auto-fold.listFoldCommands', async () => {
    const all = await vscode.commands.getCommands(true)
    const foldCmds = all.filter((c) => /editor\.foldLevel\d+/.test(c))
    logger.info('Found fold commands ->', foldCmds)

    // Search for contributes.commands entries in installed extensions
    const contributors: Array<{ command: string; extensionId: string }> = []
    for (const ext of vscode.extensions.all) {
      try {
        const contributes = ext.packageJSON?.contributes?.commands
        if (Array.isArray(contributes)) {
          for (const c of contributes) {
            if (c?.command && /editor\.foldLevel\d+/.test(c.command)) {
              contributors.push({ command: c.command, extensionId: ext.id })
            }
          }
        }
      } catch (error) {
        logger.warn('Error reading extension package.json', error)
      }
    }

    logger.info('Contributors ->', contributors)
    if (foldCmds.length === 0 && contributors.length === 0) {
      vscode.window.showInformationMessage('No editor.foldLevel* commands or contributors found.')
    } else {
      vscode.window.showInformationMessage(
        `Found ${foldCmds.length} fold commands and ${contributors.length} contributors (see Extension Host output).`,
      )
    }
  })

  context.subscriptions.push(listFoldDisposable)
}

// Called when extension is deactivated
export function deactivate() {}
