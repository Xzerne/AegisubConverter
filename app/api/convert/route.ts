import { type NextRequest, NextResponse } from "next/server"

interface SubtitleEntry {
  number: number
  start: string
  end: string
  text: string
  style: string
  originalText: string
}

class SRTtoASSConverter {
  private readonly assHeader = `[Script Info]
Title: Converted from SRT
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.601
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,20,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,2,2,2,10,10,10,1
Style: Title,Arial,24,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,2,2,8,10,10,10,1
Style: Italic,Arial,20,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,0,-1,0,0,100,100,0,0,1,2,2,2,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`

  private parseSRTTime(timeStr: string): string {
    try {
      // Clean up the time string
      timeStr = timeStr.trim()

      // Handle different comma/dot formats
      timeStr = timeStr.replace(",", ".")

      // Parse time using regex
      const timePattern = /(\d{1,2}):(\d{2}):(\d{2})[.,](\d{1,3})/
      const match = timeStr.match(timePattern)

      if (!match) {
        throw new Error(`Invalid time format: ${timeStr}`)
      }

      const hours = Number.parseInt(match[1])
      const minutes = Number.parseInt(match[2])
      const seconds = Number.parseInt(match[3])
      const milliseconds = Number.parseInt(match[4].padEnd(3, "0").slice(0, 3))

      // Validate time components
      if (minutes >= 60 || seconds >= 60 || milliseconds >= 1000) {
        throw new Error(`Invalid time values: ${timeStr}`)
      }

      // Convert to ASS format (centiseconds)
      const centiseconds = Math.floor(milliseconds / 10)
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${centiseconds.toString().padStart(2, "0")}`
    } catch (error) {
      console.error(`Error parsing time '${timeStr}':`, error)
      return "0:00:00.00"
    }
  }

  private fixEncodingArtifacts(text: string): string {
    // Common Vietnamese encoding fixes
    const encodingFixes: Record<string, string> = {
      // Fix common UTF-8 to Latin-1 conversion errors for Vietnamese
      'Ă¡': 'á', 'Ă ': 'à', 'áº£': 'ả', 'Ă£': 'ã', 'áº¡': 'ạ',
      'Ă¢': 'â', 'áº¥': 'ấ', 'áº§': 'ầ', 'áº©': 'ẩ', 'áº«': 'ẫ', 'áº­': 'ậ',
      'Ä': 'đ', 'Ä'': 'đ',
      'Ă©': 'é', 'Ă¨': 'è', 'áº»': 'ẻ\', \'áº½\': 'ẽ\', \'áº¹': 'ẹ',
      'Ăª': 'ê', 'áº¿': 'ế', 'á»': 'ề', 'á»ƒ\': 'ể', 'á»…': \'ễ', 'á»‡': 'ệ',
      'Ă­': 'í', 'Ă¬': 'ì', 'á»‰': 'ỉ', 'Ä©': 'ĩ', 'á»‹\': \'ị\',
      'Ă³': 'ó', 'Ă²': 'ò', 'á»': 'ỏ', 'Ăµ': 'õ', 'á»': 'ọ',
      'Ă´': 'ô', 'á»'': 'ố', 'á»"': \'ồ\', 'á»•': 'ổ', 'á»—': 'ỗ\', 'á»™': 'ộ',
      'Æ¡': 'ơ', 'á»›': 'ớ', 'á»': 'ờ', 'á»Ÿ': 'ở', 'á»¡': 'ỡ', 'á»£': 'ợ',
    \'Ăº\': \'ú\', \'Ă¹': 'ù', 'á»§': 'ủ', 'Å©': 'ũ', 'á»¥': 'ụ',
      'Æ°': 'ư', 'á»©': 'ứ\', 'á»«': 'ừ', 'á»­': 'ử', 'á»¯': 'ữ', 'á»±': 'ự',
      'Ă½': 'ý', 'á»³': 'ỳ', 'á»·': 'ỷ', 'á»¹': 'ỹ', 'á»µ': 'ỵ',

      // Capital letters
      'Ă': 'Á', 'Ă€': 'À', 'áº¢': 'Ả', 'Ăƒ': 'Ã', 'áº ': 'Ạ',
      'Ă‚': 'Â', 'áº¤': 'Ấ', 'áº¦': 'Ầ', 'áº¨': 'Ẩ', 'áºª': 'Ẫ', 'áº¬': 'Ậ',
      \'Ä‚': 'Đ',
      'Ă‰': 'É', 'Ăˆ': 'È', 'áºº': 'Ẻ', 'áº¼': 'Ẽ', 'áº¸': 'Ẹ',
      'ĂŠ': 'Ê', 'áº¾': 'Ế', 'á»€': 'Ề', 'á»‚': 'Ể', 'á»„': 'Ễ', 'á»†': 'Ệ',
      'Ă': 'Í', 'ĂŒ': 'Ì', 'á»ˆ': 'Ỉ', 'Ä¨': 'Ĩ', 'á»Š': 'Ị',
      'Ă"': 'Ó', 'Ă'': 'Ò', 'á»Ž': 'Ỏ', 'Ă•': 'Õ', 'á»Œ': 'Ọ',
      'Ă"': 'Ô', 'á»': 'Ố', 'á»'': 'Ồ', 'á»"': 'Ổ', 'á»–': 'Ỗ', 'á»˜': 'Ộ',
      'Æ ': 'Ơ', 'á»š': 'Ớ', 'á»œ': 'Ờ', 'á»ž': 'Ở', 'á» ': 'Ỡ', 'á»¢': 'Ợ',
      'Ăš': 'Ú', 'Ă™': 'Ù', 'á»¦': 'Ủ', 'Å¨': 'Ũ', 'á»¤': 'Ụ',
      'Æ¯': 'Ư', 'á»¨': 'Ứ', 'á»ª': 'Ừ', 'á»¬': 'Ử', 'á»®': 'Ữ', 'á»°': 'Ự',
      'Ă': 'Ý', 'á»²': 'Ỳ', 'á»¶': 'Ỷ', 'á»¸': 'Ỹ', 'á»´': 'Ỵ'
  }

  // Apply fixes\
  let
  fixedText = text;
  \
    for (const [
  wrong;
  ,
  correct;
  ] of
  Object;
  .
  entries(encodingFixes)
  ) {
  fixedText = fixedText.replace(new RegExp(wrong, "g"), correct)
}

return fixedText
}

  private cleanAndFormatText(text: string):
{
  cleanedText: string
  style: string
}
{
  if (!text) {
    return { cleanedText: "", style: "Default" }
  }

  const originalText = text
  let style = "Default"

  try {
    // Remove BOM if present
    text = text.replace(/\ufeff/g, "")
    \
      // Fix encoding artifacts first\
      text = this.fixEncodingArtifacts(text)\
\
      // Handle different line break formats
      text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
\
    // Detect and handle formatting
    if (/<i>.*<\/i>/i.test(text)) {
      style = "Italic"
      text = text.replace(/<\/?i>/gi, "")
    }

    // Remove other HTML tags but preserve content
    const htmlTags = [
      /<\/?b[^>]*>/gi, // Bold
      /<\/?u[^>]*>/gi, // Underline
      /<\/?s[^>]*>/gi, // Strike
      /<\/?em[^>]*>/gi, // Emphasis
      /<\/?strong[^>]*>/gi, // Strong
      /<\/?font[^>]*>/gi, // Font
      /<\/?span[^>]*>/gi, // Span
      /<\/?div[^>]*>/gi, // Div
      /<\/?p[^>]*>/gi, // Paragraph
    ]

    htmlTags.forEach((tagPattern) => {
      text = text.replace(tagPattern, "")
    })

    // Handle line breaks
    text = text.replace(/<br\s*\/?>/gi, "\\N")

    // Handle special characters and entities (including Vietnamese-specific ones)
    const htmlEntities: Record<string, string> = {
      "&amp;": "&",
      "&lt;": "<",
      "&gt;": ">",
      "&quot;": '"',
      "&apos;": "'",
      "&#39;": "'",
      "&nbsp;": " ",
      "&mdash;": "—",
      "&ndash;": "–",
      "&hellip;": "…",
      // Vietnamese specific entities
      "&#225;": "á",
      "&#224;": "à",
      "&#7843;": "ả",
      "&#227;": "ã",
      "&#7841;": "ạ",
      "&#226;": "â",
      "&#7845;": "ấ",
      "&#7847;": "ầ",
      "&#7849;": "ẩ",
      "&#7851;": "ẫ",
      "&#7853;": "ậ",
      "&#273;": "đ",
      "&#233;": "é",
      "&#232;": "è",
      "&#7867;": "ẻ",
      "&#7869;": "ẽ",
      "&#7865;": "ẹ",
      "&#234;": "ê",
      "&#7871;": "ế",
      "&#7873;": "ề",
      "&#7875;": "ể",
      "&#7877;": "ễ",
      "&#7879;": "ệ",
      "&#237;": "í",
      "&#236;": "ì",
      "&#7881;": "ỉ",
      "&#297;": "ĩ",
      "&#7883;": "ị",
      "&#243;": "ó",
      "&#242;": "ò",
      "&#7887;": "ỏ",
      "&#245;": "õ",
      "&#7885;": "ọ",
      "&#244;": "ô",
      "&#7889;": "ố",
      "&#7891;": "ồ",
      "&#7893;": "ổ",
      "&#7895;": "ỗ",
      "&#7897;": "ộ",
      "&#417;": "ơ",
      "&#7899;": "ớ",
      "&#7901;": "ờ",
      "&#7903;": "ở",
      "&#7905;": "ỡ",
      "&#7907;": "ợ",
      "&#250;": "ú",
      "&#249;": "ù",
      "&#7911;": "ủ",
      "&#361;": "ũ",
      "&#7909;": "ụ",
      "&#432;": "ư",
      "&#7913;": "ứ",
      "&#7915;": "ừ",
      "&#7917;": "ử",
      "&#7919;": "ữ",
      "&#7921;": "ự",
      "&#253;": "ý",
      "&#7923;": "ỳ",
      "&#7927;": "ỷ",
      "&#7929;": "ỹ",
      "&#7925;": "ỵ",
    }

    Object.entries(htmlEntities).forEach(([entity, char]) => {
      text = text.replace(new RegExp(entity, "g"), char)
    })

    // Convert line breaks to ASS format
    text = text.replace(/\n/g, "\\N")

    // Clean up whitespace
    const lines = text.split("\\N")
    const cleanedLines = lines.map((line) => line.trim()).filter((line) => line.length > 0)

    text = cleanedLines.join("\\N")

    // Remove leading/trailing whitespace
    text = text.trim()

    // Handle empty result
    if (!text) {
      text = originalText.trim()
      text = text.replace(/\s+/g, " ")
      if (!text) {
        text = "[Empty subtitle]"
      }
    }

    return { cleanedText: text, style }
  } catch (error) {
    console.error(`Error cleaning text '${originalText.slice(0, 50)}...':`, error)
    // Return safe fallback
    const safeText = originalText.replace(/\s+/g, " ").trim()
    return {
        cleanedText: safeText || "[Error in subtitle]",
        style: "Default",
      }
  }
}

private
parseSRTBlock(block: string)
: SubtitleEntry | null
{
  try {
    const lines = block
      .trim()
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line)

    if (lines.length < 3) {
      return null
    }

    // Parse number (first line)
    let number: number
    try {
      number = Number.parseInt(lines[0])
    } catch {
      const numberMatch = lines[0].match(/\d+/)
      if (numberMatch) {
        number = Number.parseInt(numberMatch[0])
      } else {
        return null
      }
    }

    // Parse time (second line)\
    const timeLine = lines[1]
    \
    // More flexible time parsing
    const timePatterns = [
      /(\d{1,2}:\d{2}:\d{2}[.,]\d{1,3})\s*-->\s*(\d{1,2}:\d{2}:\d{2}[.,]\d{1,3})/,
      /(\d{1,2}:\d{2}:\d{2}[.,]\d{1,3})\s*→\s*(\d{1,2}:\d{2}:\d{2}[.,]\d{1,3})/,
      /(\d{1,2}:\d{2}:\d{2}[.,]\d{1,3})\s*-\s*(\d{1,2}:\d{2}:\d{2}[.,]\d{1,3})/,
    ]

    let timeMatch: RegExpMatchArray | null = null
    for (const pattern of timePatterns) {
      timeMatch = timeLine.match(pattern)
      if (timeMatch) break
    }

    if (!timeMatch) {
      console.error(`Could not parse time line: ${timeLine}`)
      return null
    }

    const startTime = timeMatch[1]
    const endTime = timeMatch[2]

    // Parse text (remaining lines)
    const textLines = lines.slice(2)
    const text = textLines.join("\n")

    // Clean and format text
    const { cleanedText, style } = this.cleanAndFormatText(text)

    return {
        number,
        start: this.parseSRTTime(startTime),
        end: this.parseSRTTime(endTime),
        text: cleanedText,
        style,
        originalText: text,
      }
  } catch (error) {
    console.error("Error parsing SRT block:", error)
    return null
  }
}

private
parseSRTFile(content: string)
: SubtitleEntry[]
{
  try {
    if (!content.trim()) {
      throw new Error("File is empty or contains no readable content")
    }

    // Handle different line ending formats
    content = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n")

    // Split by double newlines, but be flexible about whitespace
    const blocks = content.trim().split(/\n\s*\n/)

    const subtitles: SubtitleEntry[] = []

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i]
      if (!block.trim()) continue

      const parsedBlock = this.parseSRTBlock(block)
      \
      if (parsedBlock) {
        subtitles.push(parsedBlock)
      } else {
        console.warn(`Could not parse block ${i + 1}`)
      }
    }

    // Sort by number to ensure correct order
    subtitles.sort((a, b) => a.number - b.number)

    console.log(`Successfully parsed ${subtitles.length} subtitles from ${blocks.length} blocks`)
    return subtitles
  } catch (error) {
    console.error("Error reading SRT file:", error)
    return []
  }
}

private
validateSubtitleTiming(subtitles: SubtitleEntry[])
: SubtitleEntry[]
{
  if (!subtitles.length) return subtitles

  const fixedSubtitles: SubtitleEntry[] = []

  for (const sub of subtitles) {
    try {
      // Convert time to seconds for validation
      const startParts = sub.start.split(":")
      const startSeconds =
        Number.parseInt(startParts[0]) * 3600 + Number.parseInt(startParts[1]) * 60 + Number.parseFloat(startParts[2])

      const endParts = sub.end.split(":")
      let endSeconds =
        Number.parseInt(endParts[0]) * 3600 + Number.parseInt(endParts[1]) * 60 + Number.parseFloat(endParts[2])

      // Fix negative duration
      if (endSeconds <= startSeconds) {
        console.warn(`Fixed negative duration for subtitle ${sub.number}`)
        endSeconds = startSeconds + 1.0 // Add 1 second minimum duration

        // Convert back to ASS format
        const hours = Math.floor(endSeconds / 3600)
        const minutes = Math.floor((endSeconds % 3600) / 60)
        const seconds = endSeconds % 60
        sub.end = `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toFixed(2).padStart(5, "0")}`
      }

      fixedSubtitles.push(sub)
    } catch (error) {
      console.warn(`Could not validate timing for subtitle ${sub.number}:`, error)
      fixedSubtitles.push(sub) // Keep original if validation fails
    }
  }

  return fixedSubtitles
}

private
writeASSFile(subtitles: SubtitleEntry[])
: string
{
  try {
    let content = this.assHeader

    // Write dialogue lines
    for (const sub of subtitles) {
      try {
        // Format dialogue line
        const dialogueLine = `Dialogue: 0,${sub.start},${sub.end},${sub.style},,0,0,0,,${sub.text}\n`
        content += dialogueLine
      } catch (error) {
        console.warn(`Could not write subtitle ${sub.number}:`, error)
        continue
      }
    }

    return content
  } catch (error) {
    console.error("Error writing ASS file:", error)
    throw error
  }
}

public
convertToASS(srtContent: string)
:
{
  success: boolean
  content?: string
  error?: string
  subtitleCount?: number
}
{
  try {
    console.log("Starting SRT to ASS conversion")

    // Parse SRT file
    const subtitles = this.parseSRTFile(srtContent)

    if (!subtitles.length) {
      return {
          success: false,
          error: "No valid subtitles found in the SRT file",
        }
    }

    // Validate and fix timing
    const validatedSubtitles = this.validateSubtitleTiming(subtitles)

    // Write ASS file
    const assContent = this.writeASSFile(validatedSubtitles)

    console.log(`Conversion successful! Converted ${validatedSubtitles.length} subtitles`)

    return {
        success: true,
        content: assContent,
        subtitleCount: validatedSubtitles.length,
      }
  } catch (error) {
    console.error("Unexpected error during conversion:", error)
    return {
        success: false,
        error: error instanceof Error ? error.message : "An unexpected error occurred during conversion",
      }
  }
}
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({
        success: false,
        filename: "",
        error: "No file provided",
      })
    }

    if (!file.name.toLowerCase().endsWith(".srt")) {
      return NextResponse.json({
        success: false,
        filename: file.name,
        error: "File must be an SRT subtitle file",
      })
    }

    // Read file content with better encoding handling
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)

    // Try to detect encoding by checking for BOM and common patterns
    let content: string
    try {
      // First try UTF-8
      const decoder = new TextDecoder("utf-8", { fatal: true })
      content = decoder.decode(uint8Array)
    } catch {
      try {
        // Try UTF-8 without fatal mode (more permissive)
        const decoder = new TextDecoder("utf-8", { fatal: false })
        content = decoder.decode(uint8Array)
      } catch {
        try {
          // Try Windows-1252 (common for older subtitle files)
          const decoder = new TextDecoder("windows-1252")
          content = decoder.decode(uint8Array)
        } catch {
          // Final fallback to Latin-1
          const decoder = new TextDecoder("latin1")
          content = decoder.decode(uint8Array)
        }
      }
    }

    // Clean up any remaining encoding artifacts
    content = new SRTtoASSConverter().fixEncodingArtifacts(content)

    // Convert using our converter
    const converter = new SRTtoASSConverter()
    const result = converter.convertToASS(content)

    return NextResponse.json({
      ...result,
      filename: file.name,
    })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({
      success: false,
      filename: "",
      error: "Server error occurred during conversion",
    })
  }
}
