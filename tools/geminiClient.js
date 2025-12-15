import fetch from "node-fetch";

// Minimal Gemini API helper.
// Converts chat-like messages and calls the Gemini API's "generateContent" endpoint.

async function generate({ apiKey, model = "text-bison-001", prompt = [], max_output_tokens = 256, temperature = 0.2 }){
    if(!apiKey) throw new Error("Gemini API key required");

    // For PaLM/text-bison models, use simple text prompt
    // For Gemini models, use chat format
    const isTextModel = model.includes("text-");
    
    let url, body, res;

    if(isTextModel){
        // PaLM API v1beta2 endpoint for text-bison
        url = `https://generativeai.googleapis.com/v1/models/${encodeURIComponent(model)}:generateText?key=${encodeURIComponent(apiKey)}`;
        console.log("[Gemini] Calling PaLM endpoint:", url.replace(apiKey, "***KEY***"));

        const promptText = Array.isArray(prompt) ? prompt.map(m => (m.content || "")).join("\n\n") : String(prompt);
        body = {
            prompt: { text: promptText },
            temperature: temperature,
            candidateCount: 1,
            maxOutputTokens: max_output_tokens
        };
    } else {
        // Gemini API v1beta endpoint for gemini models
        const contents = Array.isArray(prompt) ? prompt.map(m => ({
            role: m.role === "user" ? "user" : "model",
            parts: [{ text: m.content || "" }]
        })) : [{ role: "user", parts: [{ text: String(prompt) }] }];

        url = `https://generativelanguage.googleapis.com/v1/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
        console.log("[Gemini] Calling Gemini endpoint:", url.replace(apiKey, "***KEY***"));

        body = {
            contents: contents,
            generationConfig: {
                temperature: temperature,
                maxOutputTokens: max_output_tokens
            }
        };
    }

    res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    }).catch(err => {
        console.error("[Gemini] Fetch error:", err.message);
        return null;
    });

    console.log("[Gemini] Response status:", res?.status, res?.statusText);

    if(!res || !res.ok){
        const txt = await res?.text?.().catch(()=>"") || "";
        console.log("[Gemini] Error response body:", txt.substring(0, 500));
        throw new Error(`Gemini request failed ${res?.status}: ${txt.substring(0, 200)}`);
    }

    const data = await res.json();
    
    if(isTextModel){
        // PaLM text response format
        if(data.candidates && data.candidates.length > 0){
            return data.candidates[0].output || data.candidates[0].content || "";
        }
    } else {
        // Gemini response format
        if(data.candidates && data.candidates.length > 0){
            const candidate = data.candidates[0];
            if(candidate.content && candidate.content.parts && candidate.content.parts.length > 0){
                return candidate.content.parts[0].text || "";
            }
        }
    }
    return JSON.stringify(data);
}

export default { generate };
