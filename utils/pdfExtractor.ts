export const extractTextFromPdf = async (file: File): Promise<string> => {
    // Convert the file to a base64 string
    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    // Send the base64 string to your API
    const response = await fetch('/api/extract-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: base64 })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to extract PDF text');
    return data.text;
};
