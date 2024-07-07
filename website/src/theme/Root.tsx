import React from 'react'
import { PyodideProvider } from '@site/..'

export default function Root({ children }) {
  return <PyodideProvider>{children}</PyodideProvider>
}
