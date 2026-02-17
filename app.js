/**
 * PDF Clip - Professional PDF Processor
 * Main Application Logic
 */

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

/**
 * Application State
 */
const AppState = {
    pdfDoc: null,      // PDF.js document for viewing
    pdfBytes: null,    // Original PDF bytes for manipulation
    pdfLibDoc: null,   // pdf-lib document for editing
    fileName: '',
    fileSize: 0,
    currentPage: 1,
    totalPages: 0,
    scale: 1.0
};

/**
 * DOM Elements
 */
const elements = {
    // Upload
    uploadSection: document.getElementById('uploadSection'),
    uploadZone: document.getElementById('uploadZone'),
    fileInput: document.getElementById('fileInput'),

    // Editor
    editorSection: document.getElementById('editorSection'),
    fileName: document.getElementById('fileName'),
    fileSize: document.getElementById('fileSize'),
    closeFile: document.getElementById('closeFile'),
    newFile: document.getElementById('newFile'),

    // Tools
    toolBtns: document.querySelectorAll('.tool-btn'),

    // Preview
    previewTool: document.getElementById('previewTool'),
    pdfCanvas: document.getElementById('pdfCanvas'),
    previewPlaceholder: document.getElementById('previewPlaceholder'),
    currentPage: document.getElementById('currentPage'),
    totalPages: document.getElementById('totalPages'),
    prevPage: document.getElementById('prevPage'),
    nextPage: document.getElementById('nextPage'),
    zoomIn: document.getElementById('zoomIn'),
    zoomOut: document.getElementById('zoomOut'),
    zoomLevel: document.getElementById('zoomLevel'),

    // Split
    splitTool: document.getElementById('splitTool'),
    startPage: document.getElementById('startPage'),
    endPage: document.getElementById('endPage'),
    extractPages: document.getElementById('extractPages'),
    splitAll: document.getElementById('splitAll'),

    // Watermark
    watermarkTool: document.getElementById('watermarkTool'),
    watermarkText: document.getElementById('watermarkText'),
    watermarkFont: document.getElementById('watermarkFont'),
    watermarkSize: document.getElementById('watermarkSize'),
    watermarkOpacity: document.getElementById('watermarkOpacity'),
    opacityValue: document.getElementById('opacityValue'),
    watermarkRotation: document.getElementById('watermarkRotation'),
    rotationValue: document.getElementById('rotationValue'),
    watermarkColor: document.getElementById('watermarkColor'),
    colorHex: document.getElementById('colorHex'),
    applyWatermark: document.getElementById('applyWatermark'),

    // Actions
    downloadPdf: document.getElementById('downloadPdf'),

    // UI
    toastContainer: document.getElementById('toastContainer'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    loadingText: document.getElementById('loadingText')
};

/**
 * Utility Functions
 */
const Utils = {
    /**
     * Format file size to human readable string
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    /**
     * Show loading state
     */
    showLoading(message = 'Processing...') {
        elements.loadingText.textContent = message;
        elements.loadingOverlay.classList.remove('hidden');
    },

    /**
     * Hide loading state
     */
    hideLoading() {
        elements.loadingOverlay.classList.add('hidden');
    },

    /**
     * Show toast notification
     */
    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span class="toast-message">${message}</span>
            <button class="toast-close">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        `;

        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.remove();
        });

        elements.toastContainer.appendChild(toast);

        // Auto remove after 4 seconds
        setTimeout(() => {
            toast.style.animation = 'slideInRight 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    },

    /**
     * Debounce function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

/**
 * PDF Loading Functions
 */
const PDFLoader = {
    /**
     * Load PDF from file
     */
    async loadFromFile(file) {
        Utils.showLoading('Loading PDF...');

        try {
            const arrayBuffer = await file.arrayBuffer();
            AppState.pdfBytes = new Uint8Array(arrayBuffer);
            AppState.fileName = file.name;
            AppState.fileSize = file.size;

            // Load for viewing with PDF.js
            AppState.pdfDoc = await pdfjsLib.getDocument({ data: AppState.pdfBytes.slice() }).promise;
            AppState.totalPages = AppState.pdfDoc.numPages;
            AppState.currentPage = 1;

            // Load for editing with pdf-lib
            AppState.pdfLibDoc = await PDFLib.PDFDocument.load(AppState.pdfBytes);

            // Update UI
            elements.fileName.textContent = AppState.fileName;
            elements.fileSize.textContent = Utils.formatFileSize(AppState.fileSize);
            elements.totalPages.textContent = AppState.totalPages;
            elements.startPage.max = AppState.totalPages;
            elements.endPage.max = AppState.totalPages;

            // Show editor
            elements.uploadSection.classList.add('hidden');
            elements.editorSection.classList.remove('hidden');

            // Render first page
            await PDFRenderer.renderPage(AppState.currentPage);

            Utils.showToast('PDF loaded successfully');
        } catch (error) {
            console.error('Error loading PDF:', error);
            Utils.showToast('Failed to load PDF. Please try another file.', 'error');
        } finally {
            Utils.hideLoading();
        }
    },

    /**
     * Reset application
     */
    async reset() {
        AppState.pdfDoc = null;
        AppState.pdfBytes = null;
        AppState.pdfLibDoc = null;
        AppState.fileName = '';
        AppState.fileSize = 0;
        AppState.currentPage = 1;
        AppState.totalPages = 0;
        AppState.scale = 1.0;

        elements.uploadSection.classList.remove('hidden');
        elements.editorSection.classList.add('hidden');
        elements.fileInput.value = '';
    }
};

/**
 * PDF Rendering Functions
 */
const PDFRenderer = {
    /**
     * Render a specific page
     */
    async renderPage(pageNumber) {
        if (!AppState.pdfDoc) return;

        try {
            elements.previewPlaceholder.style.display = 'none';
            elements.pdfCanvas.style.display = 'block';

            const page = await AppState.pdfDoc.getPage(pageNumber);
            const viewport = page.getViewport({ scale: AppState.scale });

            const canvas = elements.pdfCanvas;
            const context = canvas.getContext('2d');

            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;

            // Update page controls
            elements.currentPage.textContent = pageNumber;
            elements.prevPage.disabled = pageNumber <= 1;
            elements.nextPage.disabled = pageNumber >= AppState.totalPages;
        } catch (error) {
            console.error('Error rendering page:', error);
            Utils.showToast('Error rendering page', 'error');
        }
    },

    /**
     * Go to next page
     */
    async nextPage() {
        if (AppState.currentPage < AppState.totalPages) {
            AppState.currentPage++;
            await this.renderPage(AppState.currentPage);
        }
    },

    /**
     * Go to previous page
     */
    async prevPage() {
        if (AppState.currentPage > 1) {
            AppState.currentPage--;
            await this.renderPage(AppState.currentPage);
        }
    },

    /**
     * Zoom in
     */
    async zoomIn() {
        if (AppState.scale < 3.0) {
            AppState.scale = Math.min(3.0, AppState.scale + 0.25);
            elements.zoomLevel.textContent = Math.round(AppState.scale * 100) + '%';
            await this.renderPage(AppState.currentPage);
        }
    },

    /**
     * Zoom out
     */
    async zoomOut() {
        if (AppState.scale > 0.5) {
            AppState.scale = Math.max(0.5, AppState.scale - 0.25);
            elements.zoomLevel.textContent = Math.round(AppState.scale * 100) + '%';
            await this.renderPage(AppState.currentPage);
        }
    }
};

/**
 * PDF Manipulation Functions
 */
const PDFProcessor = {
    /**
     * Extract pages from PDF
     */
    async extractPages(startPage, endPage) {
        if (!AppState.pdfLibDoc) return;

        Utils.showLoading('Extracting pages...');

        try {
            // Adjust for 0-based indexing
            const start = Math.max(0, startPage - 1);
            const end = Math.min(AppState.totalPages, endPage);

            // Create new PDF with selected pages
            const newPdf = await PDFLib.PDFDocument.create();
            const pageIndices = [];

            for (let i = start; i < end; i++) {
                pageIndices.push(i);
            }

            const copiedPages = await newPdf.copyPages(AppState.pdfLibDoc, pageIndices);
            copiedPages.forEach(page => newPdf.addPage(page));

            // Save and download
            const pdfBytes = await newPdf.save();
            this.downloadPdf(pdfBytes, `extracted_pages_${startPage}_to_${endPage}.pdf`);

            Utils.showToast('Pages extracted successfully');
        } catch (error) {
            console.error('Error extracting pages:', error);
            Utils.showToast('Failed to extract pages', 'error');
        } finally {
            Utils.hideLoading();
        }
    },

    /**
     * Split all pages into separate files
     */
    async splitAllPages() {
        if (!AppState.pdfLibDoc) return;

        Utils.showLoading('Splitting pages...');

        try {
            const pages = AppState.pdfLibDoc.getPages();
            const zip = new JSZip();
            const folder = zip.folder('extracted_pages');

            for (let i = 0; i < pages.length; i++) {
                const newPdf = await PDFLib.PDFDocument.create();
                const [copiedPage] = await newPdf.copyPages(AppState.pdfLibDoc, [i]);
                newPdf.addPage(copiedPage);

                const pdfBytes = await newPdf.save();
                folder.file(`page_${i + 1}.pdf`, pdfBytes);
            }

            // Generate and download zip
            const content = await zip.generateAsync({ type: 'blob' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = 'split_pages.zip';
            link.click();
            URL.revokeObjectURL(link.href);

            Utils.showToast('All pages split successfully');
        } catch (error) {
            console.error('Error splitting pages:', error);
            Utils.showToast('Failed to split pages', 'error');
        } finally {
            Utils.hideLoading();
        }
    },

    /**
     * Add watermark to PDF
     */
    async addWatermark(text, font, size, opacity, rotation, color) {
        if (!AppState.pdfLibDoc || !text.trim()) {
            Utils.showToast('Please enter watermark text', 'warning');
            return;
        }

        Utils.showLoading('Adding watermark...');

        try {
            const pages = AppState.pdfLibDoc.getPages();
            const { degrees, rgb, StandardFonts } = PDFLib;

            // Convert hex color to RGB
            const r = parseInt(color.slice(1, 3), 16) / 255;
            const g = parseInt(color.slice(3, 5), 16) / 255;
            const b = parseInt(color.slice(5, 7), 16) / 255;

            // Map font name to pdf-lib font
            let pdfFont;
            switch (font) {
                case 'Helvetica':
                    pdfFont = StandardFonts.Helvetica;
                    break;
                case 'Times-Roman':
                    pdfFont = StandardFonts.TimesRoman;
                    break;
                case 'Courier':
                    pdfFont = StandardFonts.Courier;
                    break;
                default:
                    pdfFont = StandardFonts.Helvetica;
            }

            for (const page of pages) {
                const { width, height } = page.getSize();

                // Calculate text width for centering
                const textWidth = pdfFont.widthOfTextAtSize(text, size);

                // Draw watermark on each page
                page.drawText(text, {
                    x: width / 2 - textWidth / 2,
                    y: height / 2,
                    size: size,
                    font: pdfFont,
                    color: rgb(r, g, b),
                    opacity: opacity / 100,
                    rotate: degrees(rotation),
                });
            }

            // Save and download
            const pdfBytes = await AppState.pdfLibDoc.save();
            this.downloadPdf(pdfBytes, `watermarked_${AppState.fileName}`);

            Utils.showToast('Watermark added successfully');
        } catch (error) {
            console.error('Error adding watermark:', error);
            Utils.showToast('Failed to add watermark', 'error');
        } finally {
            Utils.hideLoading();
        }
    },

    /**
     * Download processed PDF
     */
    downloadPdf(bytes, name) {
        try {
            const blob = new Blob([bytes], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = name;
            link.click();
            URL.revokeObjectURL(link.href);
        } catch (error) {
            console.error('Error downloading PDF:', error);
            Utils.showToast('Failed to download PDF', 'error');
        }
    },

    /**
     * Download current PDF
     */
    async downloadCurrentPdf() {
        if (!AppState.pdfLibDoc) return;

        Utils.showLoading('Preparing download...');

        try {
            const pdfBytes = await AppState.pdfLibDoc.save();
            this.downloadPdf(pdfBytes, AppState.fileName);
            Utils.showToast('PDF downloaded successfully');
        } catch (error) {
            console.error('Error downloading PDF:', error);
            Utils.showToast('Failed to download PDF', 'error');
        } finally {
            Utils.hideLoading();
        }
    }
};

/**
 * Tool Navigation
 */
function switchTool(toolName) {
    // Update button states
    elements.toolBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tool === toolName);
    });

    // Update panel visibility
    document.querySelectorAll('.tool-panel').forEach(panel => {
        panel.classList.toggle('active', panel.id === `${toolName}Tool`);
    });
}

/**
 * Event Listeners Setup
 */
function setupEventListeners() {
    // File upload - click
    elements.uploadZone.addEventListener('click', () => {
        elements.fileInput.click();
    });

    // File upload - input change
    elements.fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.type === 'application/pdf') {
            PDFLoader.loadFromFile(file);
        } else if (file) {
            Utils.showToast('Please select a PDF file', 'error');
        }
    });

    // Drag and drop
    elements.uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        elements.uploadZone.classList.add('drag-over');
    });

    elements.uploadZone.addEventListener('dragleave', () => {
        elements.uploadZone.classList.remove('drag-over');
    });

    elements.uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        elements.uploadZone.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file && file.type === 'application/pdf') {
            PDFLoader.loadFromFile(file);
        } else if (file) {
            Utils.showToast('Please drop a PDF file', 'error');
        }
    });

    // Close file
    elements.closeFile.addEventListener('click', PDFLoader.reset);
    elements.newFile.addEventListener('click', PDFLoader.reset);

    // Tool navigation
    elements.toolBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTool(btn.dataset.tool));
    });

    // Page navigation
    elements.prevPage.addEventListener('click', PDFRenderer.prevPage);
    elements.nextPage.addEventListener('click', PDFRenderer.nextPage);

    // Zoom controls
    elements.zoomIn.addEventListener('click', PDFRenderer.zoomIn);
    elements.zoomOut.addEventListener('click', PDFRenderer.zoomOut);

    // Split functionality
    elements.extractPages.addEventListener('click', async () => {
        const start = parseInt(elements.startPage.value) || 1;
        const end = parseInt(elements.endPage.value) || AppState.totalPages;

        if (start > end) {
            Utils.showToast('Start page must be less than end page', 'error');
            return;
        }

        if (start < 1 || end > AppState.totalPages) {
            Utils.showToast(`Page range must be between 1 and ${AppState.totalPages}`, 'error');
            return;
        }

        await PDFProcessor.extractPages(start, end);
    });

    elements.splitAll.addEventListener('click', async () => {
        await PDFProcessor.splitAllPages();
    });

    // Watermark controls
    elements.watermarkOpacity.addEventListener('input', (e) => {
        elements.opacityValue.textContent = e.target.value + '%';
    });

    elements.watermarkRotation.addEventListener('input', (e) => {
        elements.rotationValue.textContent = e.target.value + '°';
    });

    elements.watermarkColor.addEventListener('input', (e) => {
        elements.colorHex.textContent = e.target.value;
    });

    elements.applyWatermark.addEventListener('click', async () => {
        await PDFProcessor.addWatermark(
            elements.watermarkText.value,
            elements.watermarkFont.value,
            parseInt(elements.watermarkSize.value),
            parseInt(elements.watermarkOpacity.value),
            parseInt(elements.watermarkRotation.value),
            elements.watermarkColor.value
        );
    });

    // Download PDF
    elements.downloadPdf.addEventListener('click', PDFProcessor.downloadCurrentPdf.bind(PDFProcessor));

    // Keyboard shortcuts
    document.addEventListener('keydown', async (e) => {
        if (!AppState.pdfDoc) return;

        if (e.key === 'ArrowLeft' && !elements.prevPage.disabled) {
            await PDFRenderer.prevPage();
        } else if (e.key === 'ArrowRight' && !elements.nextPage.disabled) {
            await PDFRenderer.nextPage();
        }
    });
}

/**
 * Initialize Application
 */
function init() {
    setupEventListeners();
    console.log('PDF Clip initialized successfully');
}

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', init);
