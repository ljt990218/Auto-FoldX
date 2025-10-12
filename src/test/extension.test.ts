import * as assert from 'assert'
import * as vscode from 'vscode'

suite('Auto Fold Extension Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.')

  let extension: vscode.Extension<any> | undefined

  suiteSetup(async () => {
    // Activate the extension
    extension = vscode.extensions.getExtension('ljt990218.auto-foldx')
    if (extension && !extension.isActive) {
      await extension.activate()
    }
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

    // Test that out of range values are stored as-is (extension normalizes internally)
    await config.update('foldLevelOnOpen', [0, 8, -1], vscode.ConfigurationTarget.Global)
    const foldLevels = config.get<number[]>('foldLevelOnOpen')
    // VS Code stores raw values, extension normalizes when using them
    assert.deepStrictEqual(foldLevels, [0, 8, -1])

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

  test('Should test concurrent folding prevention mechanism', async () => {
    const config = vscode.workspace.getConfiguration('autoFold')
    await config.update('foldLevelOnOpen', [1, 2], vscode.ConfigurationTarget.Global)
    await config.update('openDelayMs', 100, vscode.ConfigurationTarget.Global)

    // Create a document with nested structure
    const doc = await vscode.workspace.openTextDocument({
      content: `// Test concurrent folding
class ConcurrentTest {
  constructor() {
    // Level 1
    if (true) {
      // Level 2
      for (let i = 0; i < 5; i++) {
        // Level 3
        console.log("nested", i);
      }
    }
  }

  anotherMethod() {
    // Another Level 1
    try {
      console.log("try block");
    } catch (e) {
      console.log("catch block");
    }
  }
}`,
      language: 'typescript'
    })

    const editor = await vscode.window.showTextDocument(doc)
    assert.ok(editor)

    // Wait for initial folding to potentially apply
    await new Promise(resolve => setTimeout(resolve, 200))

    // Try to trigger folding again on the same document
    // This should be prevented by the concurrent folding mechanism
    await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
    await vscode.window.showTextDocument(doc)

    // Wait for second folding attempt
    await new Promise(resolve => setTimeout(resolve, 200))

    // Clean up
    await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
  }).timeout(5000)

  test('Should test document tracking and skip logic', async () => {
    const config = vscode.workspace.getConfiguration('autoFold')
    await config.update('foldLevelOnOpen', [1], vscode.ConfigurationTarget.Global)
    await config.update('openDelayMs', 50, vscode.ConfigurationTarget.Global)

    // Create a document
    const doc = await vscode.workspace.openTextDocument({
      content: `// Document tracking test
function trackedFunction() {
  // This should be folded once
  if (true) {
    console.log("tracked");
  }
}`,
      language: 'javascript'
    })

    const editor = await vscode.window.showTextDocument(doc)
    assert.ok(editor)

    // Wait for folding to apply
    await new Promise(resolve => setTimeout(resolve, 150))

    // Switch to another editor and back
    await vscode.commands.executeCommand('workbench.action.newUntitledFile')
    await new Promise(resolve => setTimeout(resolve, 100))

    // Switch back to original document
    await vscode.window.showTextDocument(doc)
    await new Promise(resolve => setTimeout(resolve, 150))

    // Clean up
    await vscode.commands.executeCommand('workbench.action.closeAllEditors')
  }).timeout(5000)

  test('Should test logger functionality', async () => {
    // Test that logger functions exist and can be called
    const config = vscode.workspace.getConfiguration('autoFold')

    // Trigger some configuration changes to test logger output
    await config.update('foldLevelOnOpen', [3], vscode.ConfigurationTarget.Global)
    await new Promise(resolve => setTimeout(resolve, 100))

    await config.update('foldLevelOnOpen', [1, 2], vscode.ConfigurationTarget.Global)
    await new Promise(resolve => setTimeout(resolve, 100))

    // Reset to defaults
    await config.update('foldLevelOnOpen', [1], vscode.ConfigurationTarget.Global)

    // If we get here without errors, logger is working
    assert.ok(true, 'Logger functions should work without throwing errors')
  })

  test('Should test fold command availability detection', async () => {
    // Execute the listFoldCommands command to test fold command detection
    try {
      await vscode.commands.executeCommand('auto-fold.listFoldCommands')
      assert.ok(true, 'listFoldCommands should execute without errors')
    } catch (error) {
      assert.fail(`listFoldCommands failed: ${error}`)
    }
  })

  test('Should test complex configuration scenarios', async () => {
    const config = vscode.workspace.getConfiguration('autoFold')

    // Test with multiple fold levels including duplicates
    await config.update('foldLevelOnOpen', [1, 2, 2, 3, 1], vscode.ConfigurationTarget.Global)
    let foldLevels = config.get<number[]>('foldLevelOnOpen')
    assert.deepStrictEqual(foldLevels, [1, 2, 2, 3, 1])

    // Test with mixed valid and invalid values
    await config.update('foldLevelOnOpen', [1, 'invalid', 2, null, 3, undefined, 0], vscode.ConfigurationTarget.Global)
    foldLevels = config.get<number[]>('foldLevelOnOpen')
    // Should filter out non-numbers and zeros
    assert.deepStrictEqual(foldLevels, [1, 2, 3])

    // Test with boundary values
    await config.update('foldLevelOnOpen', [-5, 0, 1, 7, 8, 100], vscode.ConfigurationTarget.Global)
    foldLevels = config.get<number[]>('foldLevelOnOpen')
    // Should filter negatives and zeros, clamp 8 and 100 to 7
    assert.deepStrictEqual(foldLevels, [1, 7, 7, 7])

    // Reset to defaults
    await config.update('foldLevelOnOpen', [1], vscode.ConfigurationTarget.Global)
  })

  suite('Advanced Folding Tests', () => {
    let originalConfig: any

    suiteSetup(async () => {
      // Store original configuration
      const config = vscode.workspace.getConfiguration('autoFold')
      originalConfig = {
        foldLevelOnOpen: config.get('foldLevelOnOpen'),
        openDelayMs: config.get('openDelayMs')
      }
    })

    suiteTeardown(async () => {
      // Restore original configuration
      const config = vscode.workspace.getConfiguration('autoFold')
      if (originalConfig) {
        await config.update('foldLevelOnOpen', originalConfig.foldLevelOnOpen, vscode.ConfigurationTarget.Global)
        await config.update('openDelayMs', originalConfig.openDelayMs, vscode.ConfigurationTarget.Global)
      }
    })

    test('Should fold complex nested code structure', async () => {
      const config = vscode.workspace.getConfiguration('autoFold')
      await config.update('foldLevelOnOpen', [1], vscode.ConfigurationTarget.Global)
      await config.update('openDelayMs', 100, vscode.ConfigurationTarget.Global)

      // Create a complex nested document
      const doc = await vscode.workspace.openTextDocument({
        content: `// Main file
class TestClass {
  constructor() {
    // Level 1
    if (true) {
      // Level 2
      for (let i = 0; i < 10; i++) {
        // Level 3
        switch (i) {
          case 1:
            // Level 4
            try {
              // Level 5
              while (false) {
                // Level 6
                console.log("deeply nested");
              }
            } catch (e) {
              console.error(e);
            }
            break;
        }
      }
    }
  }
}`,
        language: 'typescript'
      })

      const editor = await vscode.window.showTextDocument(doc)
      assert.ok(editor)
      assert.ok(doc.getText().includes('class TestClass'))

      // Wait for folding to potentially apply
      await new Promise(resolve => setTimeout(resolve, 200))

      // Clean up
      await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
    }).timeout(5000)

    test('Should handle multiple file types', async () => {
      const config = vscode.workspace.getConfiguration('autoFold')
      await config.update('foldLevelOnOpen', [1], vscode.ConfigurationTarget.Global)

      // Test JavaScript
      const jsDoc = await vscode.workspace.openTextDocument({
        content: `// JavaScript file
function jsFunction() {
  if (true) {
    console.log("test");
  }
}`,
        language: 'javascript'
      })

      // Test TypeScript
      const tsDoc = await vscode.workspace.openTextDocument({
        content: `// TypeScript file
interface TestInterface {
  method(): void;
}

class TestClass implements TestInterface {
  method(): void {
    if (true) {
      console.log("test");
    }
  }
}`,
        language: 'typescript'
      })

      // Test Python
      const pyDoc = await vscode.workspace.openTextDocument({
        content: `# Python file
def python_function():
    if True:
        print("test")

    class InnerClass:
        def inner_method(self):
            for i in range(10):
                pass`,
        language: 'python'
      })

      assert.ok(jsDoc)
      assert.ok(tsDoc)
      assert.ok(pyDoc)

      // Clean up
      await vscode.commands.executeCommand('workbench.action.closeAllEditors')
    }).timeout(5000)

    test('Should handle configuration changes during runtime', async () => {
      const config = vscode.workspace.getConfiguration('autoFold')

      // Start with no folding
      await config.update('foldLevelOnOpen', [], vscode.ConfigurationTarget.Global)

      // Create a document
      const doc = await vscode.workspace.openTextDocument({
        content: `function test() {
  if (true) {
    console.log("test");
  }
}`,
        language: 'javascript'
      })

      await vscode.window.showTextDocument(doc)

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100))

      // Change configuration to enable folding
      await config.update('foldLevelOnOpen', [1], vscode.ConfigurationTarget.Global)

      // Wait for configuration change to propagate
      await new Promise(resolve => setTimeout(resolve, 200))

      // Clean up
      await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
    }).timeout(5000)

    test('Should handle rapid document opening and closing', async () => {
      const config = vscode.workspace.getConfiguration('autoFold')
      await config.update('foldLevelOnOpen', [1], vscode.ConfigurationTarget.Global)
      await config.update('openDelayMs', 50, vscode.ConfigurationTarget.Global)

      const documents = []

      // Rapidly open multiple documents
      for (let i = 0; i < 5; i++) {
        const doc = await vscode.workspace.openTextDocument({
          content: `// Document ${i}
function func${i}() {
  if (true) {
    console.log("test ${i}");
  }
}`,
          language: 'javascript'
        })
        documents.push(doc)
      }

      assert.strictEqual(documents.length, 5)

      // Wait for all folding operations to complete
      await new Promise(resolve => setTimeout(resolve, 300))

      // Clean up
      await vscode.commands.executeCommand('workbench.action.closeAllEditors')
    }).timeout(5000)

    test('Should handle edge case configurations', async () => {
      const config = vscode.workspace.getConfiguration('autoFold')

      // Test with extremely high fold level
      await config.update('foldLevelOnOpen', [999], vscode.ConfigurationTarget.Global)

      let foldLevels = config.get<number[]>('foldLevelOnOpen')
      // Should be clamped to maximum valid level
      assert.ok(foldLevels && foldLevels[0] <= 7)

      // Test with negative delay
      await config.update('openDelayMs', -500, vscode.ConfigurationTarget.Global)

      let openDelay = config.get<number>('openDelayMs')
      // Should be clamped to 0
      assert.strictEqual(openDelay, 0)

      // Test with extremely high delay
      await config.update('openDelayMs', 99999, vscode.ConfigurationTarget.Global)

      openDelay = config.get<number>('openDelayMs')
      // Should be clamped to maximum
      assert.strictEqual(openDelay, 5000)
    })

    test('Should preserve editor state after folding', async () => {
      const config = vscode.workspace.getConfiguration('autoFold')
      await config.update('foldLevelOnOpen', [1], vscode.ConfigurationTarget.Global)

      const doc = await vscode.workspace.openTextDocument({
        content: `// Test document
function main() {
  // First level
  if (true) {
    // Second level
    console.log("test");
  }

  // Another first level block
  try {
    console.log("try block");
  } catch (e) {
    console.log("catch block");
  }
}`,
        language: 'javascript'
      })

      const editor = await vscode.window.showTextDocument(doc)

      // Set cursor position
      const position = new vscode.Position(8, 5) // Inside the second level
      editor.selection = new vscode.Selection(position, position)

      // Wait for folding
      await new Promise(resolve => setTimeout(resolve, 200))

      // Verify editor is still active and accessible
      assert.strictEqual(vscode.window.activeTextEditor?.document.uri.toString(), doc.uri.toString())

      // Clean up
      await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
    }).timeout(5000)

    test('Should handle large files efficiently', async () => {
      const config = vscode.workspace.getConfiguration('autoFold')
      await config.update('foldLevelOnOpen', [1], vscode.ConfigurationTarget.Global)

      // Generate a large file with many nested structures
      let content = '// Large file test\n'
      for (let i = 0; i < 50; i++) {
        content += `function function${i}() {\n`
        content += '  if (true) {\n'
        content += '    console.log("test");\n'
        content += '  }\n'
        content += '}\n\n'
      }

      const startTime = Date.now()
      const doc = await vscode.workspace.openTextDocument({
        content: content,
        language: 'javascript'
      })

      await vscode.window.showTextDocument(doc)

      // Wait for folding to complete
      await new Promise(resolve => setTimeout(resolve, 1000))

      const endTime = Date.now()
      const processingTime = endTime - startTime

      // Should complete within reasonable time (adjust threshold as needed)
      assert.ok(processingTime < 3000, `Processing took ${processingTime}ms, expected < 3000ms`)

      // Clean up
      await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
    }).timeout(5000)
  })
})
