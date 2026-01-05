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
    console.log(`extractTextFromPdf: Read file of size ${file.size} bytes, base64 length ${base64FromFile.length}`);
    // Send the base64 string to your API
    const response = await fetch('/api/extract-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: base64FromFile })
    });
    console.log(response)
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to extract PDF text');

    return data.text;
};
