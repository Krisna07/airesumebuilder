

export async function handleResumeDataUpload(file: File) {
    try {
        const text = await extractTextFromPdf(file)
        const res = await fetch('/api/ai/extract-resume', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Failed to extract resume data.');
        }
        const data = await res.json();
        const resumeId = self.crypto.randomUUID();
        localStorage.setItem(`${resumeId}`, JSON.stringify({
            ...data.data, 
            id:resumeId,
            createdOn: Date.now()
        }))
        return {
            status: 200,
            data: {
                resumeName: resumeId,
                message: `Resume read successfully.`
            }
        }
    } catch (err) {
        return {
            status: 400,
            err: err
        }
    }


}

const extractTextFromPdf = async (file: File): Promise<string> => {
    // Dynamic import to avoid SSR issues
    const pdfjsLib = await import('pdfjs-dist');

    // Set up the worker source for pdfjs-dist
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

    const reader = new FileReader();
    return new Promise((resolve, reject) => {
        reader.onload = async (event) => {
            if (!event.target?.result) {
                return reject(new Error('Failed to read file.'));
            } 
            try {
                const pdf = await pdfjsLib.getDocument({ data: event.target.result as ArrayBuffer }).promise;
                let text = '';
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const content = await page.getTextContent();
                    text +=
                        content.items
                            .map((item) => {
                                if ('str' in item) {
                                    return item.str;
                                }
                                return '';
                            })
                            .join(' ') + '\n';
                }
                resolve(text);
            } catch (error) {
                console.error('Error parsing PDF:', error);
                reject(new Error('Could not parse the PDF file.'));
            }
        };
        reader.onerror = () => {
            reject(new Error('Error reading file.'));
        };
        reader.readAsArrayBuffer(file);
    });
};