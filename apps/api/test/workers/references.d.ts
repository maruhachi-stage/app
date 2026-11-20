/// <reference types="@cloudflare/vitest-plugin/types" />

declare module '*.sql?raw' {
  const content: string
  export default content
}
