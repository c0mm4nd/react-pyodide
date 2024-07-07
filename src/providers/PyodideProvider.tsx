import { createContext, useEffect, useRef, useState } from "react";
import type { loadPyodide, PyodideInterface } from "pyodide";

declare global {
  interface Window {
    loadPyodide?: typeof loadPyodide;
  }
}

interface PyodideContextType {
  isLoading: boolean;
  pyodide?: PyodideInterface | null;

  run: (runnerId: string, code: string) => Promise<any>; // eslint-disable-line
  stdoutStore: Record<string, string[]>;
  stderrStore: Record<string, string[]>;
}

const PyodideContext = createContext<PyodideContextType>({
  isLoading: false,

  run: async () => null,

  stdoutStore: {},
  stderrStore: {},
});

interface PyodideProviderProps {
  /**
   * The URL from which Pyodide will load the main Pyodide runtime and
   * packages. It is recommended that you leave this unchanged, providing an
   * incorrect value can cause broken behavior.
   *
   * Default: The url that Pyodide is loaded from with the file name
   * (``pyodide.js`` or ``pyodide.mjs``) removed.
   */
  indexURL?: string;
  /**
   * The file path where packages will be cached in node. If a package
   * exists in ``packageCacheDir`` it is loaded from there, otherwise it is
   * downloaded from the JsDelivr CDN and then cached into ``packageCacheDir``.
   * Only applies when running in node; ignored in browsers.
   *
   * Default: same as indexURL
   */
  packageCacheDir?: string;
  /**
   * The URL from which Pyodide will load the Pyodide ``pyodide-lock.json`` lock
   * file. You can produce custom lock files with :py:func:`micropip.freeze`.
   * Default: ```${indexURL}/pyodide-lock.json```
   */
  lockFileURL?: string;
  /**
   * Load the full Python standard library. Setting this to false excludes
   * unvendored modules from the standard library.
   * Default: ``false``
   */
  fullStdLib?: boolean;
  /**
   * The URL from which to load the standard library ``python_stdlib.zip``
   * file. This URL includes the most of the Python standard library. Some
   * stdlib modules were unvendored, and can be loaded separately
   * with ``fullStdLib: true`` option or by their package name.
   * Default: ```${indexURL}/python_stdlib.zip```
   */
  stdLibURL?: string;
  /**
   * Override the standard input callback. Should ask the user for one line of
   * input. The :js:func:`pyodide.setStdin` function is more flexible and
   * should be preferred.
   */
  stdin?: () => string;
  /**
   * Override the standard output callback. The :js:func:`pyodide.setStdout`
   * function is more flexible and should be preferred in most cases, but
   * depending on the ``args`` passed to ``loadPyodide``, Pyodide may write to
   * stdout on startup, which can only be controlled by passing a custom
   * ``stdout`` function.
   */
  stdout?: (msg: string) => void;
  /**
   * Override the standard error output callback. The
   * :js:func:`pyodide.setStderr` function is more flexible and should be
   * preferred in most cases, but depending on the ``args`` passed to
   * ``loadPyodide``, Pyodide may write to stdout on startup, which can only
   * be controlled by passing a custom ``stdout`` function.
   */
  stderr?: (msg: string) => void;
  /**
   * The object that Pyodide will use for the ``js`` module.
   * Default: ``globalThis``
   */
  jsglobals?: object;
  /**
   * Command line arguments to pass to Python on startup. See `Python command
   * line interface options
   * <https://docs.python.org/3.10/using/cmdline.html#interface-options>`_ for
   * more details. Default: ``[]``
   */
  args?: string[];
  /**
   * Environment variables to pass to Python. This can be accessed inside of
   * Python at runtime via :py:data:`os.environ`. Certain environment variables change
   * the way that Python loads:
   * https://docs.python.org/3.10/using/cmdline.html#environment-variables
   * Default: ``{}``.
   * If ``env.HOME`` is undefined, it will be set to a default value of
   * ``"/home/pyodide"``
   */
  env?: Record<string, string>;
  /**
   * A list of packages to load as Pyodide is initializing.
   *
   * This is the same as loading the packages with
   * :js:func:`pyodide.loadPackage` after Pyodide is loaded except using the
   * ``packages`` option is more efficient because the packages are downloaded
   * while Pyodide bootstraps itself.
   */
  packages?: string[];
  /**
   * Opt into the old behavior where :js:func:`PyProxy.toString() <pyodide.ffi.PyProxy.toString>`
   * calls :py:func:`repr` and not :py:class:`str() <str>`.
   * @deprecated
   */
  pyproxyToStringRepr?: boolean;
  /**
   * Make loop.run_until_complete() function correctly using stack switching
   */
  enableRunUntilComplete?: boolean;
  /**
   * @ignore
   */
  _node_mounts?: string[];
  /**
   * @ignore
   */
  _makeSnapshot?: boolean;
  /**
   * @ignore
   */
  _loadSnapshot?:
    | Uint8Array
    | ArrayBuffer
    | PromiseLike<Uint8Array | ArrayBuffer>;

  /**
   * The children components to render.
   */
  children: React.ReactNode;
}

function PyodideProvider(props: PyodideProviderProps) {
  const [hasScript, setHasScript] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pyodide, setPyodide] = useState<PyodideInterface | null>(null);

  const activeRunner = useRef<string | null>(null);

  // const [stdinManager, setStdinManager] = useState<() => string>(() => "");

  const [stdoutStore, setStdoutStore] = useState<Record<string, string[]>>(
    {}
  );
  const [stderrStore, setStderrStore] = useState<Record<string, string[]>>(
    {}
  );

  useEffect(() => {
    if (window.loadPyodide) {
      setHasScript(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/pyodide.js";
    script.async = true;
    script.onload = () => {
      setHasScript(true);
    };
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (hasScript && !pyodide) {
      const init = async () => {
        try {
          setIsLoading(true);
          if (!window.loadPyodide) {
            throw new Error("pyodide not loaded");
          }
          setPyodide(
            await window.loadPyodide({
              ...props,
              // stdin,
              stdout: (msg: string) =>
                setStdoutStore((prev) => {
                  if (!activeRunner.current) {
                    console.error("No active runner");
                    return {};
                  }

                  const runnerId = activeRunner.current;
                  const runnerOuts = prev[runnerId] || [];
                  runnerOuts.push(msg);

                  return {
                    ...prev,
                    [runnerId]: runnerOuts,
                  };
                }),
              stderr: (msg: string) =>
                setStderrStore((prev) => {
                  if (!activeRunner.current) {
                    console.error("No active runner");
                    return {};
                  }

                  const runnerId = activeRunner.current;
                  const runnerOuts = prev[runnerId] || [];
                  runnerOuts.push(msg);

                  return {
                    ...prev,
                    [runnerId]: runnerOuts,
                  };
                }),
            })
          );
        } catch (error) {
          // NOTE: If error is "Error: Pyodide is already loading.", this is likely due to React running in Strict Mode.
          // Strict Mode renders components twice (on dev but not production) in order to detect any problems with your code and warn you about them.
          console.error("Error loading Pyodide:", error);
        } finally {
          setIsLoading(false);
        }
      };
      init();
    }
  }, [hasScript, pyodide, props]);

  useEffect(() => {
    const initPackages = async () => {
      //       if (pyodide && "pyodide-http" in pyodide?.current?.loadedPackages) {
      //         await pyodide.runPythonAsync(`
      // import pyodide_http
      // pyodide_http.patch_all()
      //         `);
      //       }
    };

    initPackages();
  }, [pyodide]);

  useEffect(() => {
    if (pyodide) {
      console.info("Loaded pyodide version:", pyodide.version);
      setIsLoading(false);
    }
  }, [pyodide]);

  const run = async (runnerId: string, code: string) => {
    // Clear output
    setStdoutStore((prev) => {
      return {
        ...prev,
        [runnerId]: [],
      };
    });
    setStderrStore((prev) => {
      return {
        ...prev,
        [runnerId]: [],
      };
    });

    activeRunner.current = runnerId;

    if (!pyodide) {
      throw new Error("Pyodide is not loaded yet");
    }

    const result = await pyodide.runPythonAsync(code);
    return result;
  };

  return (
    <PyodideContext.Provider
      value={{
        isLoading: !hasScript || isLoading,
        pyodide,
        run,

        stdoutStore,
        stderrStore,
      }}
      {...props}
    />
  );
}

export { PyodideContext, PyodideProvider };
