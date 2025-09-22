const {contextBridge, ipcRenderer} = require("electron");

contextBridge.exposeInMainWorld("electronAPI",{
    sendMessageToOpenAI: async (content,key) => {
        return await ipcRenderer.invoke("sendMessageToOpenAI",content,key);
    },
    pickPicture: async () => {
        return await ipcRenderer.invoke("pickPicture");
    },
    saveConvo: async (convoName) => {
        await ipcRenderer.invoke("saveConvo",convoName);
    },
    loadConvo: async () => {
        return await ipcRenderer.invoke("loadConvo");
    }
})