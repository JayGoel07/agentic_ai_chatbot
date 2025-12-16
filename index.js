import { config } from "dotenv";    
config();
import express from "express";
import bodyParser from "body-parser";
import Agent from "./agent.js";
import webSearchTool from "./tools/webSearchTool.js";
import summarizeTool from "./tools/summarizeTool.js";
const app = express();
app.use(express.json());
app.use(bodyParser.json());
app.use(express.static("public"));

const agent = new Agent({
    name: "MAPRA-node",
    description: "Multi-agent research assistant (single-agent prototype).",
    tools: [
    { name: webSearchTool.name, description: webSearchTool.description, run: webSearchTool.run },
    { name: summarizeTool.name, description: summarizeTool.description, run: summarizeTool.run },
    ],
    openaiConfig: { geminiKey: process.env.GEMINI_API_KEY, model: process.env.GEMINI_MODEL },
    maxCycles: 3,  
});

app.post("/api/agent", async(req,res) => {
    try{
        const {query} = req.body;
        if(!query) return res.status(400).json({error : "Provide {query}"});
        const out = await agent.run(query);
        res.json(out);
    }
    catch(err){
        console.log(err);
        res.status(500).json({error : err.message});
    }
});

const port = process.env.PORT || 3000;
// app.listen(port, () => console.log("Server listening on port", port));
//VERCEL
export default app;