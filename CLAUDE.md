# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PDF Clip is a pure frontend PDF processing tool. All PDF operations happen client-side in the browser—no server, no database.

## Running the Project

```bash
# Option 1: Direct file open (may have browser restrictions)
open index.html

# Option 2: Local server (recommended)
python3 -m http.server 8080
# Then open http://localhost:8080
```

## Architecture

The app uses three CDN libraries:
- **PDF.js** (v3.11.174) - renders PDFs for preview
- **pdf-lib** (v1.17.1) - modifies and saves PDFs
- **JSZip** (v3.10.1) - packages split pages into ZIP downloads

### Module Structure (in app.js)

| Module | Responsibility |
|--------|----------------|
| `AppState` | In-memory PDF data (pdfDoc, pdfBytes, pdfLibDoc, currentPage, scale) |
| `Utils` | Formatting, loading UI, toast notifications, debounce |
| `PDFLoader` | Loads PDF file into both PDF.js and pdf-lib |
| `PDFRenderer` | Renders pages to canvas for preview with zoom/navigation |
| `PDFProcessor` | All manipulation: extract pages, split all, add watermark, download |
| `setupEventListeners()` | Binds all DOM events |
| `switchTool()` | Toggles between Preview/Split/Watermark panels |

### Key Design Decisions

- Maintains two PDF representations: `pdfDoc` (PDF.js, read-only) for viewing and `pdfLibDoc` (pdf-lib, mutable) for editing
- Downloads always create new files rather than modifying the original state
- Watermark is applied on download only (not stored in preview state)

## Common Tasks

- **Add new PDF tool**: Add tool button in index.html sidebar, corresponding panel, and handler in PDFProcessor
- **Modify watermark**: Adjust the `addWatermark()` method in PDFProcessor (lines 388-450)
- **Change CDN versions**: Update both index.html script tags and the PDF.js worker URL in app.js (line 7)
