// Trivial Pursuit Game
import OpenAI from "https://cdn.skypack.dev/openai";
import {translations} from "./language.js";

let client;
let players = [];
let language = "Dutch";
let country = "Netherlands";
let currentPlayerIndex = 0;
let messages = [];
let answerDisplay = "";

window.createSystemPrompt = function () {
    return {
        role: "system",
        content: `You are a Trivial Pursuit box.
        - Play this game in the ${language} language.
        - You will generate an open-ended trivia question (not multiple choice) for one of the six Trivial Pursuit categories.
        - Blue is "Geography", Pink is "Entertainment", Yellow is "History", Green is "Science", Brown is "Art and Literature", and Orange is "Sports Trivia".
        - A Player will request a question using the format: "<name> <question appropriate for a x-year-old> <color of category>".
        - You will generate a question that matches the age level provided:
          - For young children (ages 4–10): Keep questions very concrete and simple, and ensure they are grounded **exclusively in the daily life, culture, and language** of children living in ${country}. Do not reference things that are specific to other countries (e.g., yellow school buses in the U.S.). Focus on topics familiar to children in ${country}: local animals, foods, holidays, playground games, school life, TV shows, weather, and places.
          - For older children (11–16): Ask more factual and reasoning-based questions (e.g., historical events, global locations, science facts).
          - For adults: Make the questions hard (Take a look at the trivia questions in the Trivial Pursuit box).
        - Ensure the vocabulary and concepts are understandable for the specified age group.
        - Never repeat a question.
          - A question counts as repeated if it is asking for the same factual answer as a previous question, even if worded differently.
          - You MUST avoid semantically similar questions, not just exact duplicates.
        - Return your response only in this JSON format:
        {
          "question": "Wat is de hoofdstad van Frankrijk?",
          "answer": "Parijs"
        }`
      };
};    

window.updateUILanguage = function() {
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[language] && translations[language][key]) {
            element.textContent = translations[language][key];
        }
    });
    
    // Update category buttons
    document.querySelectorAll('[data-category]').forEach(button => {
        const category = button.getAttribute('data-category');
        button.textContent = translations[language][category] || category;
    });
    
    // Update all inputs with data-placeholder attribute
    document.querySelectorAll('[data-placeholder]').forEach(input => {
    const key = input.getAttribute('data-placeholder');
    if (translations[language] && translations[language][key]) {
        input.placeholder = translations[language][key];
        }
    });
}

window.updateApiKey = function () {
    const input = document.getElementById("apiKeyInput");
    var apiKey = input.value;
    console.log("API Key updated:", apiKey);
    client = new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true,
    });
    console.log("Client initialized:", client);
};

//set language
window.updateLanguage = function() {
    const select = document.getElementById("languageSelect");
    language = select.value;
    console.log("Language changed to:", language);
    updateUILanguage();
};

//set country
window.updateCountry = function() {
    const select = document.getElementById("countrySelect");
    country = select.value;
    console.log("Country changed to:", country);
};

// Player management functions
window.addPlayerInput = function() {
    if (document.querySelectorAll('.player-config').length >= 6) {
        alert(translations[language]["Maximum 6 players allowed!"]);
        return;
    }
    
    const playerInputs = document.getElementById("playerInputs");
    
    const playerDiv = document.createElement("div");
    playerDiv.className = "player-config";
    playerDiv.innerHTML = `
        <input type="text" placeholder="${translations[language]["Player name"]}" class="player-name">
        <input type="number" placeholder="${translations[language]["Age"]}  " min="1" max="99" class="player-age">
    `;
    
    playerInputs.appendChild(playerDiv);
};

window.startGame = function() {
    // Collect player information
    const playerConfigs = document.querySelectorAll('.player-config');
    players = [];
    
    playerConfigs.forEach(config => {
        const nameInput = config.querySelector('.player-name');
        const ageInput = config.querySelector('.player-age');
        
        if (nameInput.value.trim() && ageInput.value) {
            players.push({
                name: nameInput.value.trim(),
                age: parseInt(ageInput.value)
            });
        }
    });
    
    if (players.length === 0) {
        alert(translations[language]["Please add at least one player."]);
        return;
    }
    
    // Hide config screen, show game screen
    document.getElementById("playerConfigScreen").style.display = "none";
    document.getElementById("gameScreen").style.display = "block";
    
    // instruct AI
    messages = [createSystemPrompt()];
    console.log("Messages:", messages);

    // Create player buttons
    createPlayerButtons();
    
    // Set first player as active
    currentPlayerIndex = 0;
    updateActivePlayer();
};

function createPlayerButtons() {
    const playerButtonsContainer = document.getElementById("playerButtons");
    playerButtonsContainer.innerHTML = "";
    
    players.forEach((player, index) => {
        const button = document.createElement("button");
        button.className = "player-button";
        button.textContent = player.name;
        button.onclick = () => {
            currentPlayerIndex = index;
            updateActivePlayer();
        };
        
        playerButtonsContainer.appendChild(button);
    });
}

function updateActivePlayer() {
    const playerButtons = document.querySelectorAll('.player-button');
    playerButtons.forEach((button, index) => {
        if (index === currentPlayerIndex) {
            button.classList.add('active-player');
        } else {
            button.classList.remove('active-player');
        }
    });
}

window.getCurrentPlayer = function() {
    return players[currentPlayerIndex];
};

window.showAnswer = function() {
    questionDisplay.textContent = answerDisplay;
};

function pruneMessages(){
     // remove the last user message, we don't need player moves to be part of the costly prompts
     messages.pop();

    if (messages.length > 40) {
        messages = [messages[0], ...messages.slice(-10)];
    }
}

function stripJson(jsonResponse){
    try {
        const trimmed = JSON.stringify({question: jsonResponse.question});
        messages.push({ role: "assistant", content: trimmed });
    } catch (e) {
        console.error("Parse error");
    }
}

window.getQuestion = async function(color, name, age) {
    if (!client) {
        alert(translations[language]["Please enter your OpenAI API key first!"]);
        return;
    }
    
    try {
        const questionDisplay = document.getElementById("questionDisplay");
        
        // Show loading state
        questionDisplay.textContent = translations[language]["Loading question..."];
        
        // Make sure answer is hidden when getting a new question
        document.getElementById("showAnswerBtn").textContent = translations[language]["Show Answer"];
        
        messages.push(
            {
                role: "user",
                content: `${name} a question for a ${age} old ${color}`
            }
        );
        
        const response = await client.chat.completions.create({
            model: "gpt-4-turbo",
            messages: messages,
            temperature: 0.65,
            max_tokens: 150,
        });

        const responseContent = response.choices[0].message.content;
        console.log("API Response:", responseContent);
        
        pruneMessages();
        
        // remove the json markup from the assistent prompt to save token
        const jsonResponse = JSON.parse(responseContent);
        stripJson(jsonResponse);

        // Update the question display
        answerDisplay = jsonResponse.answer;

        // Show the question
        questionDisplay.textContent = jsonResponse.question;

    } catch (error) {
        console.error("Error getting question:", error);
        document.getElementById("questionDisplay").textContent = 
            "Error: Could not get question. Please check your API key and try again.";
    }
};

// Initialize the game
document.addEventListener("DOMContentLoaded", function() {
    // Any initialization code can go here
      // Set default language
      language = document.getElementById("languageSelect").value;
    
      // Initialize UI language
      if (document.getElementById("gameScreen")) {
          updateUILanguage();
      }
});
