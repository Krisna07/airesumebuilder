

export default async function scrapeWebsite(url: string): Promise<string> {
    try {
        const response = await fetch(`/api/scrape?url=${encodeURIComponent(url)}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch data from ${url}`);
        }
        const data = await response.json();
        return {
            descriptio: `${data.description}` || '',
        }
            ;
    } catch (error) {
        console.error('Error scraping website:', error);
        return '';
    }
}