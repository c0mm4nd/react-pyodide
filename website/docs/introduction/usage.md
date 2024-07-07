---
sidebar_position: 2
---

# Usage

How to use `react-py` in your project. For framework specific guides, see the sidebar.

## `PythonProvider` Provider

First, wrap your app in a `PythonProvider` component. For props, see the [API reference docs](../introduction/api-reference#pythonprovider).

```tsx
import { PythonProvider } from 'react-py'

function App() {
  return (
    // Add the provider to your app
    <PythonProvider>
      <Codeblock />
    </PythonProvider>
  )
}

render(<App />, document.getElementById('root'))
```

## `usePyodide` Hook

Use the `usePyodide` hook to run code and access both stdout and stderr. For props, see the [API reference docs](../introduction/api-reference#usePyodide-hook).

Try the example, [Basic Example](../examples/basic-example.md).

```tsx
import { useState } from 'react'
import { usePyodide } from 'react-py'

function Codeblock() {
  const [input, setInput] = useState('')

  // Use the usePyodide hook to run code and access both stdout and stderr
  const { runPython, stdout, stderr, isLoading, isRunning } = usePyodide()

  return (
    <>
      {isLoading ? <p>Loading...</p> : <p>Ready!</p>}
      <form>
        <textarea
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter your code here"
        />
        <input
          type="submit"
          value={!isRunning ? 'Run' : 'Running...'}
          disabled={isLoading || isRunning}
          onClick={(e) => {
            e.preventDefault()
            runPython(input)
          }}
        />
      </form>
      <p>Output</p>
      <pre>
        <code>{stdout}</code>
      </pre>
      <p>Error</p>
      <pre>
        <code>{stderr}</code>
      </pre>
    </>
  )
}
```

## `usePyodideConsole` Hook

Use the `usePyodideConsole` hook to emulate a Python console to run code and access both stdout and stderr. For props, see the [API reference docs](../introduction/api-reference#usePyodide-hook).

Try the example, [REPL](../examples/repl.mdx).

:::note
The Python console is not affected by the globally set `lazy` or `terminateOnCompletion` props.
:::

```tsx
import { useEffect, useState } from 'react'
import { usePyodideConsole } from 'react-py'
import { ConsoleState } from 'react-py/dist/types/Console'

function Codeblock() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')

  const {
    runPython,
    stdout,
    stderr,
    isLoading,
    isRunning,
    banner,
    consoleState
  } = usePyodideConsole()

  useEffect(() => {
    setOutput((prev) => [...prev, stdout])
  }, [stdout])

  useEffect(() => {
    setOutput((prev) => [...prev, stderr])
  }, [stderr])

  function getPrompt() {
    return consoleState === ConsoleState.incomplete ? '... ' : '>>> '
  }

  function run() {
    setOutput((prev) => [...prev, getPrompt() + input + '\n'])
    runPython(input)
  }

  return (
    <>
      {isLoading ? <p>Loading...</p> : <p>Ready!</p>}
      <p>
        <b>Output</b>
      </p>
      <pre>
        {banner}
        <br />
        {output}
      </pre>
      <pre>
        {getPrompt()}
        <form>
          <textarea
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter your code here"
          />
          <input
            type="submit"
            value={!isRunning ? 'Run' : 'Running...'}
            disabled={isLoading || isRunning}
            onClick={(e) => {
              e.preventDefault()
              run()
            }}
          />
        </form>
      </pre>
    </>
  )
}
```
