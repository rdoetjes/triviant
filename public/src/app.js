// Trivial Pursuit Game
import OpenAI from "https://cdn.skypack.dev/openai";

let client;
let players = [];
let currentPlayerIndex = 0;
let answerVisible = false;

window.createSystemPrompt = function () {
    return {
        role: "system",
        content: `You are a Trivial Pursuit box.
            - You will generate an open question (not a multiple-choice question) for one of the six Trivial Pursuit categories.
            - Blue is "Geography", Pink is "Entertainment", Yellow is "History", Green is "Science", Brown is "Art and Literature", and Orange is "Sports Trivia".
            - You will wait for a Player to ask for a category. This Player's request is formatted as: "<name> <question appropriate for a 4-year-old> <color of category>".
            - The questions should be a bit challenging intermediate to hard as Europeans are smarter than Americans.
            - You will generate the question and answer into this JSON format and only return this format:
                {  
                "question": "What is the capital of France?",  
                "name": "John",  
                "Question appropriate for age": "50",  
                "category": "Geography",  
                "answer": "Paris"  
                }  
            - Make sure the variations of the questions are extremely widely different.
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
        <input type="number" placeholder="Age" min="1" max="120" class="player-age">
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
        
        const messages = [
            createSystemPrompt(),
            {
                role: "user",
                content: `${name} question appropriate for age ${age} ${color}`
            }
        ];
        
        const response = await client.chat.completions.create({
            model: "gpt-4",
            messages: messages,
            temperature: 0.7,
        });
        
        const responseContent = response.choices[0].message.content;
        console.log("API Response:", responseContent);
        
        try {
            const jsonResponse = JSON.parse(responseContent);
            questionDisplay.textContent = jsonResponse.question;
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
