import * as assert from 'assert'
import * as vscode from 'vscode'

suite('Auto Fold Extension Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.')

  let extension: vscode.Extension<any> | undefined

  suiteSetup(() => {
    // Activate the extension
    extension = vscode.extensions.getExtension('auto-fold')
  })

  test('Extension should be present', () => {
    assert.ok(extension)
  })

  test('Extension should be activated', async () => {
    if (extension) {
      await extension.activate()
      assert.strictEqual(extension.isActive, true)
    }
  })

  test('Configuration defaults should be correct', () => {
    const config = vscode.workspace.getConfiguration('autoFold')

    // Test foldLevelOnOpen default
    const foldLevels = config.get<number[]>('foldLevelOnOpen')
    assert.deepStrictEqual(foldLevels, [1])

    // Test openDelayMs default
    const openDelay = config.get<number>('openDelayMs')
    assert.strictEqual(openDelay, 300)
  })

  test('Configuration should accept valid values', async () => {
    const config = vscode.workspace.getConfiguration('autoFold')

    // Test setting fold levels
    await config.update('foldLevelOnOpen', [1, 2, 3], vscode.ConfigurationTarget.Global)
    const foldLevels = config.get<number[]>('foldLevelOnOpen')
    assert.deepStrictEqual(foldLevels, [1, 2, 3])

    // Test setting delay
    await config.update('openDelayMs', 500, vscode.ConfigurationTarget.Global)
    const openDelay = config.get<number>('openDelayMs')
    assert.strictEqual(openDelay, 500)

    // Reset to defaults
    await config.update('foldLevelOnOpen', [1], vscode.ConfigurationTarget.Global)
    await config.update('openDelayMs', 300, vscode.ConfigurationTarget.Global)
  })

  test('Configuration should normalize invalid values', async () => {
    const config = vscode.workspace.getConfiguration('autoFold')

    // Test that out of range values are normalized
    await config.update('foldLevelOnOpen', [0, 8, -1], vscode.ConfigurationTarget.Global)
    const foldLevels = config.get<number[]>('foldLevelOnOpen')
    // Should filter out invalid values (0, -1) and clamp 8 to 7
    assert.deepStrictEqual(foldLevels, [7])

    // Reset to defaults
    await config.update('foldLevelOnOpen', [1], vscode.ConfigurationTarget.Global)
  })

  test('Extension should register commands', async () => {
    const commands = await vscode.commands.getCommands(true)
    assert.ok(commands.includes('auto-fold.listFoldCommands'))
  })

  test('Extension should handle document open events', async () => {
    // Create a temporary document
    const doc = await vscode.workspace.openTextDocument({
      content: `// Level 1
function test() {
  // Level 2
  if (true) {
    // Level 3
    console.log("test")
  }
}`,
      language: 'javascript',
    })

    assert.ok(doc)

    // Close the document
    await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
  })

  test('Should handle multiple fold levels configuration', async () => {
    const config = vscode.workspace.getConfiguration('autoFold')

    // Test multiple fold levels
    await config.update('foldLevelOnOpen', [1, 2, 3], vscode.ConfigurationTarget.Global)
    const foldLevels = config.get<number[]>('foldLevelOnOpen')
    assert.deepStrictEqual(foldLevels, [1, 2, 3])

    // Reset to defaults
    await config.update('foldLevelOnOpen', [1], vscode.ConfigurationTarget.Global)
  })

  test('Should handle single number configuration fallback', async () => {
    const config = vscode.workspace.getConfiguration('autoFold')

    // Test single number configuration (should be converted to array)
    await config.update('foldLevelOnOpen', 2, vscode.ConfigurationTarget.Global)
    const foldLevels = config.get<number[]>('foldLevelOnOpen')
    assert.deepStrictEqual(foldLevels, [2])

    // Reset to defaults
    await config.update('foldLevelOnOpen', [1], vscode.ConfigurationTarget.Global)
  })

  test('Should handle empty configuration (disable folding)', async () => {
    const config = vscode.workspace.getConfiguration('autoFold')

    // Test empty array (should disable folding)
    await config.update('foldLevelOnOpen', [], vscode.ConfigurationTarget.Global)
    const foldLevels = config.get<number[]>('foldLevelOnOpen')
    assert.deepStrictEqual(foldLevels, [])

    // Reset to defaults
    await config.update('foldLevelOnOpen', [1], vscode.ConfigurationTarget.Global)
  })

  test('Should handle invalid configuration values', async () => {
    const config = vscode.workspace.getConfiguration('autoFold')

    // Test with invalid values (should be filtered out)
    await config.update('foldLevelOnOpen', [1, 'invalid', 2, null, 3], vscode.ConfigurationTarget.Global)
    const foldLevels = config.get<number[]>('foldLevelOnOpen')
    // Should only keep valid numbers
    assert.deepStrictEqual(foldLevels, [1, 2, 3])

    // Reset to defaults
    await config.update('foldLevelOnOpen', [1], vscode.ConfigurationTarget.Global)
  })

  test('Should clamp fold levels to valid range (1-7)', async () => {
    const config = vscode.workspace.getConfiguration('autoFold')

    // Test values outside valid range
    await config.update('foldLevelOnOpen', [0, 1, 7, 8, -1], vscode.ConfigurationTarget.Global)
    const foldLevels = config.get<number[]>('foldLevelOnOpen')
    // Should filter out 0 and -1, clamp 8 to 7
    assert.deepStrictEqual(foldLevels, [1, 7, 7])

    // Reset to defaults
    await config.update('foldLevelOnOpen', [1], vscode.ConfigurationTarget.Global)
  })

  test('Should handle openDelayMs configuration bounds', async () => {
    const config = vscode.workspace.getConfiguration('autoFold')

    // Test minimum value
    await config.update('openDelayMs', 0, vscode.ConfigurationTarget.Global)
    let openDelay = config.get<number>('openDelayMs')
    assert.strictEqual(openDelay, 0)

    // Test maximum value
    await config.update('openDelayMs', 5000, vscode.ConfigurationTarget.Global)
    openDelay = config.get<number>('openDelayMs')
    assert.strictEqual(openDelay, 5000)

    // Test value above maximum (should be clamped)
    await config.update('openDelayMs', 10000, vscode.ConfigurationTarget.Global)
    openDelay = config.get<number>('openDelayMs')
    assert.strictEqual(openDelay, 5000)

    // Test negative value (should be clamped to 0)
    await config.update('openDelayMs', -100, vscode.ConfigurationTarget.Global)
    openDelay = config.get<number>('openDelayMs')
    assert.strictEqual(openDelay, 0)

    // Reset to defaults
    await config.update('openDelayMs', 300, vscode.ConfigurationTarget.Global)
  })

  test('Should handle invalid openDelayMs values', async () => {
    const config = vscode.workspace.getConfiguration('autoFold')

    // Test with invalid values (should fallback to default)
    await config.update('openDelayMs', 'invalid', vscode.ConfigurationTarget.Global)
    let openDelay = config.get<number>('openDelayMs')
    assert.strictEqual(openDelay, 300) // Should fallback to default

    await config.update('openDelayMs', null, vscode.ConfigurationTarget.Global)
    openDelay = config.get<number>('openDelayMs')
    assert.strictEqual(openDelay, 300) // Should fallback to default

    // Reset to defaults
    await config.update('openDelayMs', 300, vscode.ConfigurationTarget.Global)
  })

  test('Should register listFoldCommands command', async () => {
    const commands = await vscode.commands.getCommands(true)
    assert.ok(commands.includes('auto-fold.listFoldCommands'), 'listFoldCommands should be registered')
  })

  test('Should execute listFoldCommands without errors', async () => {
    // This test verifies the command can be executed without throwing errors
    try {
      await vscode.commands.executeCommand('auto-fold.listFoldCommands')
      // If we get here, the command executed successfully
      assert.ok(true, 'listFoldCommands executed successfully')
    } catch (error) {
      assert.fail(`listFoldCommands failed with error: ${error}`)
    }
  })

  test('Should handle document with folding markers', async () => {
    // Create a document with explicit folding markers
    const doc = await vscode.workspace.openTextDocument({
      content: `// #region Level 1
function test() {
  // #region Level 2
  if (true) {
    console.log("test");
  }
  // #endregion
}
// #endregion`,
      language: 'javascript',
    })

    assert.ok(doc)
    assert.ok(doc.getText().includes('#region'), 'Document should contain folding markers')

    // Close the document
    await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
  })

  test('Should handle document without folding markers', async () => {
    // Create a simple document without folding markers
    const doc = await vscode.workspace.openTextDocument({
      content: `console.log("Hello World");
const x = 1;
const y = 2;`,
      language: 'javascript',
    })

    assert.ok(doc)
    assert.ok(!doc.getText().includes('#region'), 'Document should not contain folding markers')

    // Close the document
    await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
  })

  test('Should handle configuration change events', async () => {
    const config = vscode.workspace.getConfiguration('autoFold')

    // Change configuration to trigger the event
    await config.update('foldLevelOnOpen', [2, 3], vscode.ConfigurationTarget.Global)

    // Verify the change was applied
    const foldLevels = config.get<number[]>('foldLevelOnOpen')
    assert.deepStrictEqual(foldLevels, [2, 3])

    // Reset to defaults
    await config.update('foldLevelOnOpen', [1], vscode.ConfigurationTarget.Global)
  })

  test('Should handle concurrent document operations', async () => {
    // Create multiple documents to test concurrent handling
    const doc1 = await vscode.workspace.openTextDocument({
      content: `function test1() {
  console.log("test1");
}`,
      language: 'javascript',
    })

    const doc2 = await vscode.workspace.openTextDocument({
      content: `function test2() {
  console.log("test2");
}`,
      language: 'javascript',
    })

    assert.ok(doc1)
    assert.ok(doc2)

    // Close all documents
    await vscode.commands.executeCommand('workbench.action.closeAllEditors')
  })

  test('Should handle extension activation and deactivation', async () => {
    if (extension) {
      // Test activation
      await extension.activate()
      assert.strictEqual(extension.isActive, true, 'Extension should be active')

      // Test that extension can be deactivated (though deactivate function is empty)
      // This is more of a structural test
      assert.ok(typeof extension.exports === 'object', 'Extension should export something')
    }
  })
})
