/**
 * Resume extraction utilities
 * Note: PDF extraction is handled server-side via /api/extract-pdf
 * This module provides helper functions if needed
 */

// Re-export for backward compatibility
export { extractTextFromPdf } from './pdfExtractor';

/**
 * Placeholder for client-side extraction if needed in the future
 * Currently using server-side extraction via /api/extract-pdf
 */
export async function extractTextFromPdfFile(
    file: File,
    onProgress?: (message: string) => void
): Promise<string> {
    onProgress?.('Reading PDF file...');
    
    const maxFileBytes = 10 * 1024 * 1024; // 10 MB
    if (file.size > maxFileBytes) {
        throw new Error(`File too large. Max supported size is ${maxFileBytes} bytes.`);
    }

    // Convert to base64
    const base64FromFile = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => {
            reader.abort();
            reject(new Error('Failed to read file'));
        };
        reader.onload = () => {
            const result = reader.result as string | ArrayBuffer | null;
            if (!result || typeof result !== 'string') return reject(new Error('Unexpected file read result'));
            const idx = result.indexOf('base64,');
            if (idx === -1) return reject(new Error('Missing base64 data'));
            resolve(result.substring(idx + 7));
        };
        reader.readAsDataURL(file);
    });

    onProgress?.('Uploading to server...');
    
    const response = await fetch('/api/extract-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: base64FromFile })
    });

    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.error || 'Failed to extract PDF text');
    }

    return data.text;
}