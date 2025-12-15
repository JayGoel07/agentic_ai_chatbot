import fetch from "node-fetch";

export default {
    name: "web-search",
    description: "Search the web and return short snippets",
    run: async (query) => {
        if (!query) return "No query provided to web_search.";
        
        if (!process.env.SERP_API_KEY) {
            return "Error: SERP_API_KEY not set in .env file. Web search is disabled.";
        }
        
        try {
            const url = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${process.env.SERP_API_KEY}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error(`Search API request failed: ${res.status}`);
            const data = await res.json();
            
            // Extract organic results/snippets
            if (data.organic_results && data.organic_results.length > 0) {
                const snippets = data.organic_results.slice(0, 3).map(r => 
                    `${r.title}\n${r.snippet || r.link}`
                ).join("\n\n");
                return snippets;
            } else if (data.error) {
                return `Search error: ${data.error}`;
            } else {
                return "No search results found.";
            }
        } catch (error) {
            console.error("Web search error:", error.message);
            throw new Error(`Web search failed: ${error.message}`);
        }
    }
};