import OpenAI from "openai";
import geminiClient from "./tools/geminiClient.js";

class Agent{

    constructor(opts){
        this.name = opts.name || "agent";
        this.description = opts.description || "An AI agent";
        this.tools = {};
        (opts.tools || []).forEach(t=> {this.tools[t.name] = t;});
        // support either OpenAI or Gemini (Google Generative API)
        this.model = process.env.GEMINI_MODEL ;
        this.openai = opts.openaiConfig.apiKey ? new OpenAI({ apiKey: opts.openaiConfig.apiKey }) : null;
        this.geminiKey = process.env.GEMINI_API_KEY || opts.openaiConfig.geminiKey || null;
        this.maxCycles = opts.maxCycles || 4;
    }

    buildPlanningPrompt(userInput, memoryText = ""){
        const toolList = Object.values(this.tools).map(t=> `${t.name}: ${t.description}`).join("\n");
        return `
            You are an autonomous agent named "${this.name}".
            Description: ${this.description}

            TOOLS AVAILABLE:
            ${toolList}

            CONSTRAINTS:
            - When you want to use a tool, respond with a single JSON object describing the action.
            - The JSON must be valid and the "action" field must be one of the tool names or "FINAL_ANSWER".
            - If using a tool, include "action_input" with the tool input.
            - If you're finished, respond with {"action":"FINAL_ANSWER","action_input":"<final answer text>"}.

            USER QUESTION:
            ${userInput}

            MEMORY:
            ${memoryText}

            Respond with a single JSON object (no surrounding text). Example:
            {"action":"web_search","action_input":"latest papers on agentic AI 2024"}
        `;
    }

    // call LLM for planning
    async planOnce(userInput, memoryText = ""){
        const prompt  = this.buildPlanningPrompt(userInput, memoryText);
        let text;
        if (this.geminiKey) {
            // use Gemini/PaLM-style generative endpoint via helper
            try {
                const gen = await geminiClient.generate({
                    apiKey: this.geminiKey,
                    model: this.model,
                    prompt: [{ role: "system", content: "You are a JSON-outputting planner" }, { role: "user", content: prompt }],
                    max_output_tokens: 600,
                    temperature: 0.2,
                });
                text = (gen || "").trim();
                if(!text) throw new Error("Empty response from Gemini");
            } catch(geminiErr) {
                console.error("[Agent] Gemini failed, falling back to OpenAI:", geminiErr.message);
                if(!this.openai) throw geminiErr;
                // fallback to OpenAI
                const resp = await this.openai.chat.completions.create({
                    model: this.model || process.env.OPENAI_MODEL || "gpt-3.5-turbo",
                    messages: [
                        { role: "system", content: "You are a JSON-outputting planner" },
                        { role: "user", content: prompt }
                    ],
                    max_tokens: 600,
                    temperature: 0.2,
                });
                text = resp.choices[0].message.content.trim();
            }
        } else if (this.openai) {
            const resp = await this.openai.chat.completions.create({
                model: this.model || process.env.OPENAI_MODEL || "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: "You are a JSON-outputting planner" },
                    { role: "user", content: prompt }
                ],
                max_tokens: 600,
                temperature: 0.2,
            });
            text = resp.choices[0].message.content.trim();
        } else {
            throw new Error("No LLM API key configured (set GEMINI_API_KEY or OPENAI_API_KEY)");
        }
        // try to extract JSON
        try{
            const json = JSON.parse(text);
            return json;
        }catch(e){
            // model returned text + json
            const firstBrace = text.indexOf("{");
            const lastBrace = text.lastIndexOf("}");
            if(firstBrace!==-1 && lastBrace!==-1){
                const sub = text.slice(firstBrace, lastBrace+1);
                try{
                    return JSON.parse(sub);
                }catch(e2){
                    throw new Error("Planner retruned non-JSON and we couldnt parse it:\n" + text);
                }
            }throw new Error("Planner returned non-JSON and no braces found:\n" + text);
        }
    }

    // execute a single tool by name 
    async executeTool(toolName, toolInput){
        const tool = this.tools[toolName];
        if(!tool) throw new Error(`Unknown tool: ${toolName}`);
        return await tool.run(toolInput);
    }

    // Run : loop planning -> tool execution -> feed results back -> finish
    async run(userInput, options = {}){
        let memoryText = options.memoryText || "";
        let cycle = 0;
        let lastToolOutput = "";
        while(cycle < this.maxCycles){
            cycle+=1;
            // build context with previous tool Output 
            const contextforPlanner = userInput + (lastToolOutput ? `\n\nPrevious tool result:\n${lastToolOutput}` : "");
            let plan;
            try{
                plan = await this.planOnce(contextforPlanner, memoryText);
            }catch(err){
                return {error: `Planning error: ${err.message}`};
            }
            if(plan.action == "FINAL_ANSWER"){
                return { result: plan.action_input, cycles :  cycle}
            }

            // run the tool
            try{
                const toolResult = await this.executeTool(plan.action, plan.action_input);
                lastToolOutput = typeof toolResult === "string" ? toolResult : JSON.stringify(toolResult, null, 2);
            }catch(err){
                lastToolOutput = `Tool ${plan.action} failed : ${err.message}`;
            }
        }
        // ask planner one more time to finalise
        try {
            const finalPrompt = userInput + `\n\nLast tool result:\n${lastToolOutput}\n\nPlease produce the FINAL_ANSWER now.`;
            const finalPlan = await this.planOnce(finalPrompt, memoryText);
            if(finalPlan.action === "FINAL_ANSWER"){
                return {result: finalPlan.action_input, cycles:cycle+1};
            }else {
                return {error : "Could not get final answer after max cycle", lastPlan : finalPlan, lastToolOutput};
            }
        }catch(err){
            return {error: "Finalisation failed" + err.message, lastToolOutput};
        }
    }
}

// class exported
export default Agent;