declare module '@chenglou/pretext' {
  interface Line {
    width: number
    text: string
  }
  interface LayoutResult {
    lines: Line[]
  }
  type PreparedSegments = unknown
  export function prepareWithSegments(
    text: string,
    font: string,
    options?: Record<string, unknown>
  ): PreparedSegments
  export function layoutWithLines(
    prepared: PreparedSegments,
    maxWidth: number,
    lineHeight: number
  ): LayoutResult
}
