const axios = require('axios');
const cheerio = require('cheerio');

async function extractData(url) {
    try {
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const $ = cheerio.load(response.data);

        const title = $('title').text() || 'No title found';

        const favicon = $('link[rel="icon"]').attr('href');
        let logo = favicon || '';

        if (logo && !logo.startsWith('http')) {
            const baseUrl = new URL(url);
            logo = logo.startsWith('/')
                ? `${baseUrl.origin}${logo}` // absolute path from root
                : `${baseUrl.href}${logo}`; // relative path from current directory
        }
        return { title, logo };
    } catch (error) {
        console.error(`Error fetching metadata for ${url}:`, error.message);
        return { title: "No title found", logo: "No logo found" };
    }
}

module.exports = {
    extractData
};