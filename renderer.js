// HTML Elements
const saveButton = document.getElementById("Save");
const loadButton = document.getElementById("Load");
const keyField = document.getElementById("Key");
const convoName = document.getElementById("ConvoName");
const messageField = document.getElementById("MessageInput");
const attachmentButton = document.getElementById("AttachmentSend");
const sendButton = document.getElementById("MessageSend");
const chatHistory = document.getElementById("HistoryContainer");

keyField.value = window.localStorage.getItem("key");

keyField.addEventListener("change",async () => {
    console.log("Saving new API key to local storage");
    window.localStorage.setItem("key",keyField.value);
});

// Save & Load
saveButton.addEventListener("click", async () => {
    console.log("Saving");
    await window.electronAPI.saveConvo(convoName.value);
});
loadButton.addEventListener("click", async () => {
    const conversationData = await window.electronAPI.loadConvo();
    convoName.value = conversationData[0];
    const conversation = conversationData[1];
    console.log(conversation);
    if (conversation == null) { return; }

    for(let i = 0; i < conversation.length; i++) {
        if (conversation[i].role == "user") {
            const userMessageContainer = document.createElement("div");
            userMessageContainer.className = "UserMessage";
            const userMessageText = document.createElement("p");
            userMessageText.textContent = conversation[i].content[0].text;
            userMessageContainer.appendChild(userMessageText);
            chatHistory.appendChild(userMessageContainer);
            chatHistory.scrollTop = chatHistory.scrollHeight;

            if (conversation[i].content.length == 2) {
                const attachmentElement = document.createElement("img");
                attachmentElement.src = conversation[i].content[1].image_url;
                userMessageContainer.appendChild(attachmentElement);
            }
        } else if (conversation[i].role == "assistant") {
            const aiMessageContainer = document.createElement("div");
            aiMessageContainer.className = "AIMessage";
            aiMessageContainer.innerHTML = conversation[i].content;
            chatHistory.appendChild(aiMessageContainer);
            chatHistory.scrollTop = chatHistory.scrollHeight;
        }
    }
});



// Send message to OpenAI
let attachment;
const sendMessage = async(content) => { // (This function both sends message to OpenAI and creates a message element)
    // Empty the text box
    messageField.value = "";
    
    // Log user's message
    const userMessageContainer = document.createElement("div");
    userMessageContainer.className = "UserMessage";
    const userMessageText = document.createElement("p");
    userMessageText.textContent = content;
    userMessageContainer.appendChild(userMessageText);
    chatHistory.appendChild(userMessageContainer);
    chatHistory.scrollTop = chatHistory.scrollHeight;

    let finalContent = [{
        "type": "input_text",
        "text": content
    }];
    if (attachment != null) {
        console.log("Pushing attachment");
        finalContent.push({
            "type": "input_image",
            "image_url": "data:image/png;base64,"+attachment
        });

        const attachmentElement = document.createElement("img");
        attachmentElement.src = "data:image/png;base64,"+attachment;
        userMessageContainer.appendChild(attachmentElement);
    }
    attachment = null;

    // Send message to OpenAI
    const answer = await window.electronAPI.sendMessageToOpenAI(finalContent,keyField.value);

    // Log AI's message
    const aiMessageContainer = document.createElement("div");
    aiMessageContainer.className = "AIMessage";
    aiMessageContainer.innerHTML = answer;
    chatHistory.appendChild(aiMessageContainer);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}
sendButton.addEventListener("click",() => { // This calls sendMessage on SEND button click
    sendMessage(messageField.value);
});
messageField.addEventListener("keydown",(event) => { // This calls sendMessage on ENTER key press
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendMessage(messageField.value);
    }
});

// Send images to OpenAI
attachmentButton.addEventListener("click", async () => {
    const picture = await window.electronAPI.pickPicture();
    if (picture == null) {
        attachment = null
        return;
    }
    attachment = picture;
}); 