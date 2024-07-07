import { useContext, useEffect, useState } from "react";
import { PyodideContext } from "../providers/PyodideProvider";
import type { PythonError } from "pyodide/ffi";
import { v4 as uuidv4 } from "uuid";

interface UsePyodideProps {
  packages: string[];
}

interface UsePyodideReturn {
  runPython: (code: string) => Promise<any>; // eslint-disable-line
  
  runnerId: string;
  setRunnerId: (runnerId: string) => void;
  newRunnerId: () => void;
  
  packages: string[];
  setPackages: (packages: string[]) => void;

  isLoading: boolean;
  isRunning: boolean;
  isAwaitingInput: boolean,

  stdout: string;
  stderr: string;

  sendInput: (value: string)=>void,
  prompt: string,

  globals: Record<string, any>; // eslint-disable-line
}

function usePyodide(props: UsePyodideProps): UsePyodideReturn {
  const [runnerId, setRunnerId] = useState<string>(uuidv4());
  const [isRunning, setIsRunning] = useState(false);
  const [packages, setPackages] = useState<string[]>(props.packages);

  const { pyodide, isLoading, stdoutStore, stderrStore, run } =
    useContext(PyodideContext);

  useEffect(() => {
    const loadPackage = async (packages: string[]) => {
      if (!isLoading && packages) {
        const micropip = pyodide?.pyimport("micropip");
        for (const pkg of packages) {
          console.log(`Installing ${pkg}`);
          await micropip.install(pkg);
          console.log(`Installed ${pkg}`);
        }
      }
    };

    loadPackage(packages);
  }, [isLoading, packages]);

  const runPython = async (code: string) => {
    // Clear stdout and stderr

    if (isLoading) {
      console.error("Pyodide is not loaded yet");
      return;
    }

    let result = null;
    try {
      setIsRunning(true);
      result = await run(runnerId, code);
    } catch (e: unknown) {
      const error = e as PythonError;
      console.error(error.message);
    } finally {
      setIsRunning(false);
    }

    return result;
  };

  const newRunnerId = () => {
    setRunnerId(uuidv4());
  };

  return {
    // pyodide, Return type of exported function has or is using name 'CanvasInterface' from external module "./node_modules/pyodide/pyodide" but cannot be named.
    runPython,

    runnerId,
    setRunnerId,
    newRunnerId,

    packages,
    setPackages,
    
    isLoading,
    isRunning,
    isAwaitingInput: false,
    
    stdout: stdoutStore[runnerId]?.join("\n") || "",
    stderr: stderrStore[runnerId]?.join("\n") || "",

    sendInput: ()=> alert("Not implemented"),
    prompt: "",

    globals: pyodide?.globals || {},
  };
}

export default usePyodide;
