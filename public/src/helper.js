export function pruneMessages(messages){
     // remove the last user message, we don't need player moves to be part of the costly prompts
     messages.pop();

    if (messages.length > 40) {
        messages = [messages[0], ...messages.slice(-10)];
    }
}

export function stripJson(jsonResponse, messages) {
    try {
        console.log("JSON Response:", jsonResponse);
        const trimmed = JSON.stringify({question: jsonResponse.question});
        messages.push({ role: "assistant", content: trimmed });
    } catch (e) {
        console.error("Parse error "+e);
    }
}