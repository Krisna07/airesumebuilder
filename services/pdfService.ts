export const extractTextFromPdf = async (file: File): Promise<string> => {
    // Defensive size check (client-side) — warn if file is large
    const maxFileBytes = 10 * 1024 * 1024; // 10 MB
    if (file.size > maxFileBytes) {
        throw new Error(`File too large. Max supported size is ${maxFileBytes} bytes.`);
    }

    // Use FileReader.readAsDataURL to avoid constructing large intermediate arrays
    const base64FromFile = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => {
            reader.abort();
            reject(new Error('Failed to read file'));
        };
        reader.onload = () => {
            const result = reader.result as string | ArrayBuffer | null;
            if (!result || typeof result !== 'string') return reject(new Error('Unexpected file read result'));
            // result is like: data:application/pdf;base64,JVBERi0xLjQKJ...
            const idx = result.indexOf('base64,');
            if (idx === -1) return reject(new Error('Missing base64 data'));
            resolve(result.substring(idx + 7));
        };
        reader.readAsDataURL(file);
    });
    const response = await fetch('/api/extract-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: base64FromFile })
    });

    const data = await response.json().catch(() => ({} as Record<string, unknown>));
    if (!response.ok) {
        const serverError = typeof data?.error === 'string' ? data.error : '';
        throw new Error(serverError || 'Failed to extract PDF text');
    }

    const text = typeof data?.text === 'string' ? data.text : '';
    if (!text.trim()) {
        throw new Error('No extractable text found in PDF. If this is a scanned PDF/image-based resume, try exporting a text-based PDF.');
    }

    return text;
};
