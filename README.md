# react-pyodide

[![Build Status](https://img.shields.io/github/workflow/status/c0mm4nd/react-pyodide/Tests?style=flat-square&label=Tests)](https://github.com/c0mm4nd/react-pyodide/actions?query=workflow%3ATests+branch%3Amain)

[![CodeQL](https://img.shields.io/github/workflow/status/c0mm4nd/react-pyodide/CodeQL?style=flat-square&label=CodeQL)](https://github.com/c0mm4nd/react-pyodide/actions?query=workflow%3ACodeQL+branch%3Amain)
[![MIT License](https://img.shields.io/npm/l/react-pyodide?style=flat-square)](https://github.com/c0mm4nd/react-pyodide/blob/main/LICENSE.md)
[![NPM Version](https://img.shields.io/npm/v/react-pyodide?style=flat-square)](https://www.npmjs.com/package/react-pyodide)
[![NPM Bundle Size](https://img.shields.io/bundlephobia/min/react-pyodide?style=flat-square)](https://bundlephobia.com/package/react-pyodide)

Run Python code directly in the browser. [Try it out!](https://react-pyodide.c0mm4nd.com/)

## Examples

[Basic example](https://react-pyodide.c0mm4nd.com/)

## Installation

```
npm install react-pyodide
```

## Usage

```tsx
import { useState } from "react";
import { usePython, PythonProvider } from "react-pyodide";

function App() {
  return (
    // Add the provider to your app
    <PythonProvider>
      <Codeblock />
    </PythonProvider>
  );
}

function Codeblock() {
  const [input, setInput] = useState("");

  // Use the usePython hook to run code and access both stdout and stderr
  const { runPython, stdout, stderr, isLoading, isRunning } = usePython();

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
          value={!isRunning ? "Run" : "Running..."}
          disabled={isLoading || isRunning}
          onClick={(e) => {
            e.preventDefault();
            runPython(input);
          }}
        />
      </form>
      <p>Output</p>
      <pre>{stdout}</pre>
      <p>Error</p>
      <pre>{stderr}</pre>
    </>
  );
}

render(<App />, document.getElementById("root"));
```

## Limitations

Most of the Python standard library is functional, except from some modules. The following modules can be imported, but are not functional due to the limitations of the WebAssembly VM:

- multiprocessing
- threading
- sockets

[Learn more about the limitations here](https://pyodide.org/en/stable/usage/wasm-constraints.html).

## Roadmap

- [ ] Add additional examples
- [ ] Ability to run python in Web Workers
- [ ] Extended API for custom configuration

## License

_react-pyodide_ is available under the MIT License.

## Contact

Command M - [c0mm4nd](https://github.com/c0mm4nd)

## Acknowlegments

This project is heavily based on [Pyodide](https://pyodide.org/), a Python distribution for the browser and Node.js based on WebAssembly.
