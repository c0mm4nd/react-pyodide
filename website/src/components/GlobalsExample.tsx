import React, { useEffect, useState } from 'react'

import BrowserOnly from '@docusaurus/BrowserOnly'
import { useColorMode } from '@docusaurus/theme-common'
import { usePyodide } from '@site/..'

import Controls from './Controls'
import Loader from './Loader'
import { ArrowPathIcon, PlayIcon, StopIcon } from '@heroicons/react/24/solid'

const editorOptions = {
  enableBasicAutocompletion: true,
  enableLiveAutocompletion: true,
  highlightActiveLine: false,
  showPrintMargin: false
}

const editorOnLoad = (editor) => {
  editor.renderer.setScrollMargin(10, 10, 0, 0)
  editor.moveCursorTo(0, 0)
}

interface GlobalsProps {
  code: string
  packages?: string[]
}

export default function GlobalsExample(props: GlobalsProps) {
  const { code, packages } = props
  const [input, setInput] = useState(code.trimEnd())
  const [showOutput, setShowOutput] = useState(false)
  const [valueFromGlobals, setValueFromGlobals] = useState('')
  const [key, setKey] = useState('')

  useEffect(() => {
    setInput(code.trimEnd())
    setShowOutput(false)
  }, [code])

  const { colorMode } = useColorMode()

  const {
    runPython,
    stdout,
    stderr,
    isLoading,
    isRunning,
    globals
  } = usePyodide({ packages })

  function run() {
    runPython(input)
    setShowOutput(true)
  }

  function reset() {
    setShowOutput(false)
    setInput(code.trimEnd())
  }

  useEffect(() => {
    async function get() {
      const value = await globals[key]
      console.log(`value for ${key}:`, value)
      setValueFromGlobals(value)
    }

    !isLoading && globals && key && get()
  }, [isLoading, globals, setValueFromGlobals])

  return (
    <div>
      <div className="relative mb-10 flex flex-col">
        <Controls
          items={[
            {
              label: 'Run',
              icon: PlayIcon,
              onClick: run,
              disabled: isLoading || isRunning,
              hidden: isRunning
            },
            {
              label: 'Reset',
              icon: ArrowPathIcon,
              onClick: reset,
              disabled: isRunning
            }
          ]}
        />

        {isLoading && <Loader />}

        <BrowserOnly fallback={<div>Loading...</div>}>
          {() => {
            const AceEditor = require('react-ace').default
            require('ace-builds/src-noconflict/mode-python')
            require('ace-builds/src-noconflict/theme-textmate')
            require('ace-builds/src-noconflict/theme-idle_fingers')
            require('ace-builds/src-noconflict/ext-language_tools')
            return (
              <AceEditor
                value={input}
                mode="python"
                name="CodeBlock"
                fontSize="0.9rem"
                className="min-h-[4rem] overflow-clip rounded shadow-md"
                theme={colorMode === 'dark' ? 'idle_fingers' : 'textmate'}
                onChange={(newValue) => setInput(newValue)}
                width="100%"
                maxLines={Infinity}
                onLoad={editorOnLoad}
                editorProps={{ $blockScrolling: true }}
                setOptions={editorOptions}
              />
            )
          }}
        </BrowserOnly>
      </div>
      <div>
        <h2>Fetch any Python varible value</h2>
        {showOutput ? (
          <div>
            <div className="text-green-500">{stdout}</div>
            <div className="text-red-500">{stderr}</div>
            <div className="flex">
              <div>
                <label htmlFor="key">Varible name</label>
                <input
                  type="text"
                  value={key}
                  placeholder="type the varible name, e.g. `a`"
                  onChange={(e) => setKey(e.target.value)}
                />
              </div>

              <div className="w-full text-right">
                The value is {valueFromGlobals}
              </div>
            </div>
          </div>
        ) : (
          'Please run the code first'
        )}
      </div>
    </div>
  )
}
