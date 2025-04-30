// Trivial Pursuit Game
import OpenAI from "https://cdn.skypack.dev/openai";

let client;
let players = [];
let language = "Dutch";
let currentPlayerIndex = 0;
let answerVisible = false;
let messages = [];

window.createSystemPrompt = function () {
    return {
        role: "system",
        content: `You are a Trivial Pursuit box.
            - Play this game in the ${language} language.
            - You will generate an open-ended trivia question (not multiple choice) for one of the six Trivial Pursuit categories.
            - Blue is "Geography", Pink is "Entertainment", Yellow is "History", Green is "Science", Brown is "Art and Literature", and Orange is "Sports Trivia".
            - A Player will request a question using the format: "<name> <question appropriate for a x-year-old> <color of category>".
            - You will generate a question that matches the age level provided:
            - For young children (ages 4–10): Keep questions concrete, simple, and based on commonly known things (e.g., animals, colors, weather, basic places, or TV shows for their age).
            - For older children (11–15): Ask more factual and reasoning-based questions (e.g., historical events, global locations, science facts).
            - For adults: Make the questions intermediate to hard.
            - You will ensure the vocabulary and concepts are understandable for the specified age.
            - You will return your response only in this JSON format:
            {
            "question": "What is the capital of France?",
            "answer": "Paris"
            }
            - Make sure the questions vary widely in style and content across categories.
            - Avoid the same question twice!!!
      `}
};    

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
};

// Player management functions
window.addPlayerInput = function() {
    if (document.querySelectorAll('.player-config').length >= 6) {
        alert("Maximum 6 players allowed!");
        return;
    }
    
    const playerInputs = document.getElementById("playerInputs");
    const playerCount = playerInputs.children.length + 1;
    
    const playerDiv = document.createElement("div");
    playerDiv.className = "player-config";
    playerDiv.innerHTML = `
        <input type="text" placeholder="Player ${playerCount} Name" class="player-name">
        <input type="number" placeholder="Age" min="1" max="99" class="player-age">
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
        alert("Please add at least one player!");
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

window.toggleAnswer = function() {
    const answerDisplay = document.getElementById("answerDisplay");
    const showAnswerBtn = document.getElementById("showAnswerBtn");
    
    if (answerVisible) {
        answerDisplay.classList.add("blurred");
        showAnswerBtn.textContent = "Show Answer";
    } else {
        answerDisplay.classList.remove("blurred");
        showAnswerBtn.textContent = "Hide Answer";
    }
    
    answerVisible = !answerVisible;
};

window.getQuestion = async function(color, name, age) {
    if (!client) {
        alert("Please enter your OpenAI API key first!");
        return;
    }
    
    try {
        const questionDisplay = document.getElementById("questionDisplay");
        const answerDisplay = document.getElementById("answerDisplay");
        
        // Show loading state
        questionDisplay.textContent = "Loading question...";
        answerDisplay.textContent = "";
        
        // Make sure answer is hidden when getting a new question
        answerDisplay.classList.add("blurred");
        document.getElementById("showAnswerBtn").textContent = "Show Answer";
        answerVisible = false;
        
        messages.push(
            {
                role: "user",
                content: `${name} ${age} ${color}`
            }
        );
        
        const response = await client.chat.completions.create({
            model: "gpt-4.5-preview",
            messages: messages,
            temperature: 1.3,
        });
        
        const responseContent = response.choices[0].message.content;
        console.log("API Response:", responseContent);
        
        try {
            const jsonResponse = JSON.parse(responseContent);
            questionDisplay.textContent = jsonResponse.question;
            messages.push(
                {
                    role: "assistant",
                    content: responseContent
                }
            );
            answerDisplay.textContent = jsonResponse.answer;
        } catch (parseError) {
            console.error("Error parsing JSON response:", parseError);
            questionDisplay.textContent = "Error: Could not parse question. Please try again.";
        }
    } catch (error) {
        console.error("Error getting question:", error);
        document.getElementById("questionDisplay").textContent = 
            "Error: Could not get question. Please check your API key and try again.";
    }
};

// Initialize the game
document.addEventListener("DOMContentLoaded", function() {
    // Any initialization code can go here
});
