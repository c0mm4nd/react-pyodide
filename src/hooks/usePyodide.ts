import { useContext, useEffect, useState } from "react";
import { PyodideContext } from "../providers/PyodideProvider";
import { v4 as uuidv4 } from "uuid";

interface UsePyodideProps {
  packages: string[];
}

interface UsePyodideReturn {
  runPython: (code: string) => Promise<any>;
  packages: string[];
  setPackages: (packages: string[]) => void;
  isLoading: boolean;
  isRunning: boolean;

  stdout: string;
  stderr: string;
}

function usePyodide(props: UsePyodideProps): UsePyodideReturn {
  // const [runnerId, setRunnerId] = useState<string>()
  const [runnerId, setRunnerId] = useState<string>(uuidv4());
  const [isRunning, setIsRunning] = useState(false);
  const [packages, setPackages] = useState<string[]>(props.packages);

  const { pyodide, isLoading, stdoutStore, stderrStore, run, output } =
    useContext(PyodideContext);

  useEffect(() => {
    const loadPackage = async (packages: string[]) => {
      if (pyodide && packages) {
        await pyodide.loadPackage(packages);
        console.log("Packages loaded");
      }
    };

    loadPackage(packages);
  }, [pyodide, packages]);

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
    } catch (error: any) {
      console.error(error.message);
    } finally {
      setIsRunning(false);
      return result;
    }
  };

  return {
    // pyodide, Return type of exported function has or is using name 'CanvasInterface' from external module "./node_modules/pyodide/pyodide" but cannot be named.
    runPython,
    packages,
    setPackages,
    isLoading,
    isRunning,
    stdout: stdoutStore[runnerId]?.join("\n") || "",
    stderr: stderrStore[runnerId]?.join("\n") || "",
  };
}

export default usePyodide;
