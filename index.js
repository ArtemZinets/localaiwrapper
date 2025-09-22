const { ipcMain, dialog } = require("electron");
const { app, BrowserWindow } = require("electron/main");
const path = require("node:path");
const { OpenAI } = require("openai");
const fs = require("fs/promises");
const katex = require("katex");

const model = "gpt-5";

const inlineMathRegex = /\$(.+?)\$/g;
const blockMathRegex = /\$\$(.+?)\$\$/gs;

let conversation = [
    {
        "role": "developer",
        "content": "When writing LaTeX expressions, only use inline and block expressions wrapped in $...$ or $$...$$. Do not use document-level LaTeX symbols like \\documentclass. Also, do not use square brackets (form \\[...\\]), fall back to dollar signs."
    }
];

ipcMain.handle("sendMessageToOpenAI",async (_,content,key) => {
    if (key != "") {
        const openAIclient = new OpenAI({
            apiKey: key
        });

        conversation.push({
            "role": "user",
            "content": content
        });
        const response = await openAIclient.responses.create({
            model: model,
            input: conversation
        })
    
        conversation.push({
            "role": "assistant",
            "content": response.output_text
        });
    
        const marked = await import("marked");
    
        let rawResponse = response.output_text;
        try {
            rawResponse = rawResponse.replace(blockMathRegex,(_,tex) => {
                return katex.renderToString(tex.trim(), {displayMode: true});
            });
            rawResponse = rawResponse.replace(inlineMathRegex,(_,tex) => {
                return katex.renderToString(tex.trim(), {displayMode: true});
            });
        } catch (error) {
            
        }
        return marked.parse(rawResponse);
    }
    return "Error: No OpenAI API key provided!";
});

ipcMain.handle('pickPicture', async () => {
    const result = await dialog.showOpenDialog({
        properties: ['openFile']
    });
    if (result.filePaths[0] == undefined) {
        return null;
    } else {
        const picture = (await fs.readFile(result.filePaths[0])).toString("base64");
        return picture;
    }
});

ipcMain.handle("saveConvo",async (_, convoName) => {
    const result = await dialog.showOpenDialog({
        properties: ['openDirectory']
    });
    await fs.writeFile(path.resolve(__dirname,result.filePaths[0],convoName+".json"),JSON.stringify(conversation));
});

ipcMain.handle("loadConvo", async () => {
    const result = await dialog.showOpenDialog({
        properties: ['openFile']
    });
    if (result.filePaths[0] == undefined) {
        return null;
    } else {
        try {
            const log = JSON.parse(await fs.readFile(result.filePaths[0]));
            conversation = log;
            return [path.basename(result.filePaths[0],".json"), log];
        } catch(err) {
            return null;
        }
    }
});

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.resolve(__dirname,"preload.js")
        }
    });

    win.loadFile("index.html");
}

app.whenReady().then(createWindow);