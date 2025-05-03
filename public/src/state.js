import OpenAI from "https://cdn.skypack.dev/openai";

class State {
    client = null;
    players = [];
    language = "";
    country = "";
    currentPlayerIndex = 0;
    messages = [];
    answerDisplay = "";
    queryDisplay = "";
    queryRunning = false;

    constructor() {
        this.language = "Dutch";
        this.country = "Netherlands";
    }

    addPlayer(player) {
        this.players.push(player);
    }

    addMessage(message) {
        this.messages.push(message);
        this.messages.forEach(message => console.log(message));
    }

    getNrPlayers() {
        return this.players.length;
    }

    setClient(apiKey) {
        this.client = new OpenAI({
            apiKey,
            dangerouslyAllowBrowser: true,
        });
    }

    setLanguage(language) {
        this.language = language;
    }

    setCountry(country) {
        this.country = country;
    }

    setPlayers(players) {
        this.players = players;
    }

    setCurrentPlayerIndex(index) {
        this.currentPlayerIndex = index;
    }

    setMessages(messages) {
        this.messages = messages;
    }

    setAnswerDisplay(answerDisplay) {
        this.answerDisplay = answerDisplay;
    }

    getClient() {
        return this.client;
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
    getMessages() {
        return this.messages;
    }

    getCurrentPlayerIndex() {
        return this.currentPlayerIndex;
    }

    getAnswerDisplay() {
        return this.answerDisplay;
    }

    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }

    getMessages() {
        return this.messages;
    }

    getCurrentPlayerIndex() {
        return this.currentPlayerIndex;
    }

    setQueryDisplay(queryDisplay) {
        this.queryDisplay = queryDisplay;
    }

    getQueryDisplay() {
        return this.queryDisplay;
    }

    pruneMessages() {
        // remove the last user message, we don't need player moves to be part of the costly prompts
        this.messages.pop();

        if (this.messages.length > 40) {
            this.messages = [this.messages[0], ...this.messages.slice(-10)];
        }
    }

    addQuestionToPrompt(questionToAvoidDuplicates) {
        this.messages.push({ role: "assistant", content: "Avoid this question: "+questionToAvoidDuplicates });
    }

    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }

    setQuerRunning(queryRunning) {
        this.queryRunning = queryRunning;
    }

    getQueryRunning() {
        return this.queryRunning;
    }
}

export const state = new State();