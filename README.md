# PDF Clip - Professional PDF Processor

A pure frontend PDF processing tool. No server, no database, just open and use.

## Quick Start

### Option 1: Direct File Open
Double-click `index.html` to open it directly in your browser.

### Option 2: Local Server (Recommended)
```bash
# Using Python
python3 -m http.server 8080

# Then open in browser
http://localhost:8080
```

### Option 3: VS Code Live Server
If you use VS Code, install the "Live Server" extension and click "Go Live".

## Requirements

- Modern browser (Chrome, Firefox, Safari, Edge)
- Internet connection on first load (for CDN resources)

## Features

- Upload PDF (drag & drop or click)
- View PDF with zoom and navigation
- Extract specific pages
- Split all pages into separate PDFs (ZIP download)
- Add watermark with custom text, font, size, color, opacity, rotation
- Download processed PDF

## Notes

1. **CDN Resources**: The app loads PDF.js, pdf-lib, and JSZip from CDN. First-time load requires internet.
2. **Offline Use**: After first load, browsers typically cache CDN resources.
3. **Local Files**: All processing happens locally in your browser. No files are uploaded to any server.
4. **Browser Restrictions**: Some browsers may have restrictions on `file://` protocol. If issues occur, use a local server.
