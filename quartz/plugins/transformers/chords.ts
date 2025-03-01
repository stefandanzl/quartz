// chordsPlugin.ts
import { QuartzTransformerPlugin } from "../types"
import { visit } from "unist-util-visit"
import { BuildCtx } from "../../util/ctx"

interface ChordsPluginOptions {
  // Custom class name for the chord container
  className?: string
  // Whether to highlight chords with a different color
  highlightChords?: boolean
  // Color for section headers like [Verse], [Chorus]
  sectionColor?: string
  // Color for chord names
  chordColor?: string
}

export const ChordsPlugin: QuartzTransformerPlugin<ChordsPluginOptions> = (options) => {
  const opts = {
    className: "song-chords",
    highlightChords: true,
    sectionColor: "#1976d2", // Default blue color for sections
    chordColor: "#e63946", // Default red color for chords
    ...options,
  }

  return {
    name: "ChordsPlugin",
    markdownPlugins: (ctx: BuildCtx) => {
      return [
        () => {
          return (tree) => {
            visit(tree, "code", (node) => {
              // Only transform code blocks with the language "chords"
              if (node.lang === "chords") {
                // Convert the code block to a div with chord formatting
                node.type = "html"

                // Process the content line by line
                const lines = String(node.value).split("\n")
                let formattedLines = ""

                for (const line of lines) {
                  // Handle section headers like [Verse], [Chorus]
                  if (line.trim().startsWith("[") && line.trim().endsWith("]")) {
                    formattedLines += `<div class="section-header">${line.trim()}</div>\n`
                    continue
                  }

                  // Handle empty lines
                  if (line.trim() === "") {
                    // formattedLines += `<div class="empty-line">&nbsp;</div>\n`
                    continue
                  }

                  // Improved chord line detection including slash chords (e.g., B/F#)
                  // This regex detects lines with chord patterns including those with slash notation
                  const isChordLine =
                    /^(\s*[A-G][#b]?(?:m|maj|min|aug|dim|sus|add|\d+)*\d*(?:\/[A-G][#b]?)?\s*)+$/.test(
                      line,
                    )

                  if (isChordLine) {
                    // Find all chord positions and split the line
                    const chordPositions = []
                    let match
                    // Updated pattern to match slash chords (e.g., B/F#, A/E)
                    const chordPattern =
                      /([A-G][#b]?(?:m|maj|min|aug|dim|sus|add|\d+)*\d*(?:\/[A-G][#b]?)?)/g

                    while ((match = chordPattern.exec(line)) !== null) {
                      chordPositions.push({
                        start: match.index,
                        end: match.index + match[0].length,
                        chord: match[0],
                      })
                    }

                    let processedLine = ""
                    let lastEnd = 0

                    for (const pos of chordPositions) {
                      // Add spaces before the chord
                      processedLine += line.substring(lastEnd, pos.start)
                      // Add the chord with span
                      processedLine += `<span class="chord">${pos.chord}</span>`
                      lastEnd = pos.end
                    }

                    // Add any remaining text
                    processedLine += line.substring(lastEnd)

                    formattedLines += `<div class="chord-line">${processedLine}</div>`
                  } else {
                    // This is a lyric line - use the original line with spaces preserved
                    formattedLines += `<div class="lyric-line">${line}</div>`
                  }
                }

                // Add a placeholder div for external control panel
                const controlPanelPlaceholder = `<div class="chords-control-panel-placeholder"></div>`

                // Add style attributes based on configuration
                const sectionColorStyle = opts.sectionColor
                  ? `style="--section-color: ${opts.sectionColor};"`
                  : ""
                const chordColorStyle = opts.chordColor
                  ? `style="--chord-color: ${opts.chordColor};"`
                  : ""

                // If both are provided, combine them
                const styleAttr =
                  opts.sectionColor && opts.chordColor
                    ? `style="--section-color: ${opts.sectionColor}; --chord-color: ${opts.chordColor};"`
                    : sectionColorStyle || chordColorStyle

                // Combine placeholder with formatted content
                node.value = `<div class="${opts.className}" ${styleAttr}>\n${controlPanelPlaceholder}\n${formattedLines}</div>`
              }
            })
          }
        },
      ]
    },
  }
}

export default ChordsPlugin
