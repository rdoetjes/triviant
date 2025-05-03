// state.js
// Import Google Generative AI SDK from CDN
import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";

class State {
    // Store the GoogleGenerativeAI instance, not the model itself yet
    genAI = null;
    players = [];
    language = "";
    country = "";
    currentPlayerIndex = 0;
    // Use Gemini message format: { role: 'user'/'model', parts: [{ text: '...' }] }
    messages = [];
    answerDisplay = "";
    queryDisplay = "";
    queryRunning = false;

    constructor() {
        this.language = "Dutch"; // Default language
        this.country = "Netherlands"; // Default country
    }

    addPlayer(player) {
        this.players.push(player);
    }

    // Add message in Gemini format
    addMessage(message) {
        // message should be { role: 'user'/'model', text: '...' }
        if (message.role && message.text) {
             this.messages.push({ role: message.role, parts: [{ text: message.text }] });
             console.log("Message added:", this.messages[this.messages.length - 1]);
        } else {
            console.warn("Attempted to add invalid message format:", message);
        }
       // this.messages.forEach(message => console.log(JSON.stringify(message))); // More readable console log for objects
    }

    getNrPlayers() {
        return this.players.length;
    }

    setClient(apiKey) {
        if (!apiKey) {
            console.error("API Key is missing.");
            this.genAI = null;
            return;
        }
        try {
             // Initialize the main GenerativeAI instance
            this.genAI = new GoogleGenerativeAI(apiKey);
            console.log("GoogleGenerativeAI client initialized.");
        } catch (error) {
            console.error("Error initializing GoogleGenerativeAI:", error);
            this.genAI = null;
             alert("Failed to initialize Google AI Client. Check API Key and console.");
        }
    }

    setLanguage(language) {
        this.language = language;
        // Clear message history when language changes, as system prompt depends on it
        this.messages = [];
    }

    setCountry(country) {
        this.country = country;
         // Clear message history when country changes, as system prompt depends on it
        this.messages = [];
    }

    setPlayers(players) {
        this.players = players;
    }

    setCurrentPlayerIndex(index) {
        this.currentPlayerIndex = index;
    }

    setMessages(messages) {
        // Ensure messages are in the correct format if set externally
        this.messages = messages.map(msg => ({
            role: msg.role,
            parts: msg.parts || [{ text: msg.content || "" }] // Basic conversion attempt
        }));
    }

    setAnswerDisplay(answerDisplay) {
        this.answerDisplay = answerDisplay;
    }

    // Renamed for clarity - returns the GoogleGenerativeAI instance
    getGenAI() {
        return this.genAI;
    }

    getLanguage() {
        return this.language;
    }

    getCountry() {
        return this.country;
    }

    getPlayers() {
        return this.players;
    }

    // Returns messages ready for the Gemini API call's 'contents' field
    getMessages() {
        // Filter out any potentially empty/invalid messages just in case
        return this.messages.filter(msg => msg.role && msg.parts && msg.parts.length > 0 && msg.parts[0].text);
    }

    getCurrentPlayerIndex() {
        return this.currentPlayerIndex;
    }

    getAnswerDisplay() {
        return this.answerDisplay;
    }

    getCurrentPlayer() {
        if (this.players.length === 0) return null;
        return this.players[this.currentPlayerIndex];
    }

    setQueryDisplay(queryDisplay) {
        this.queryDisplay = queryDisplay;
    }

    getQueryDisplay() {
        return this.queryDisplay;
    }

    pruneMessages() {
        // Remove the last user message (which triggered the latest API call)
        // Ensures conversation doesn't grow indefinitely with user requests
        if (this.messages.length > 0 && this.messages[this.messages.length - 1].role === 'user') {
            this.messages.pop();
            console.log("Pruned last user message.");
        }

        // Keep history manageable (e.g., last ~20 turns = 40 messages)
        // Gemini pricing might be different, adjust as needed.
        const maxMessages = 40;
        if (this.messages.length > maxMessages) {
            // Keep the first N messages (if needed for context) and the last M messages
            // For simplicity here, just keep the last `maxMessages`
             this.messages = this.messages.slice(-maxMessages);
             console.log(`Pruned messages, keeping last ${maxMessages}.`);
            // Alternative: Keep first (system-like if applicable) and tail
            // this.messages = [this.messages[0], ...this.messages.slice(-(maxMessages - 1))];
        }
    }

    // Add the AI's response (question) to history to avoid duplicates
    addQuestionToPrompt(questionToAvoidDuplicates) {
        // Use 'model' role for Gemini
        this.addMessage({ role: "model", text: "Avoid this question: "+questionToAvoidDuplicates });
    }

    setQueryRunning(queryRunning) {
        this.queryRunning = queryRunning;
    }

    getQueryRunning() {
        return this.queryRunning;
    }
}

export const state = new State();