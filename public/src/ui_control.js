// Trivial Pursuit Game
import {translations} from "./language.js";
import {state} from "./state.js";

window.createSystemPrompt = function () {
    return {
        role: "system",
        content: `You are a Trivial Pursuit box.
        - Play this game in the ${state.getLanguage()} language.
        - You will generate an open-ended trivia question (not multiple choice) for one of the six Trivial Pursuit categories.
        - Blue is "Geography", Pink is "Entertainment", Yellow is "History", Green is "Science", Brown is "Art and Literature", and Orange is "Sports Trivia".
        - A Player will request a question using the format: "<name> <question appropriate for a x-year-old> <color of category>".
        - You will generate a question that matches the age level provided:
          - For young children (ages 4–10): Keep questions very concrete and simple, and ensure they are grounded **exclusively in the daily life, culture, and language** of children living in ${state.getCountry()}. Do not reference things that are specific to other countries (e.g., yellow school buses in the U.S.). Focus on topics familiar to children in ${state.getCountry()}: local animals, foods, holidays, playground games, school life, TV shows, weather, and places.
          - For older children (11–16): Ask more factual and reasoning-based questions (e.g., historical events, global locations, science facts).
          - For adults: Make the questions hard (Take a look at the trivia questions in the Trivial Pursuit box).
        - Ensure the vocabulary and concepts are understandable for the specified age group.
        - Avoid questions that are about the same TV characters, such as Sesame street, Peppa Pig, Nijntje/Miffie, or Disney princesses.
            - Avoid questions about their colours, it's in appropriate.
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
        if (translations[state.getLanguage()] && translations[state.getLanguage()][key]) {
            element.textContent = translations[state.getLanguage()][key];
        }
    });
    
    // Update category buttons
    document.querySelectorAll('[data-category]').forEach(button => {
        const category = button.getAttribute('data-category');
        button.textContent = translations[state.getLanguage()][category] || category;
    });
    
    // Update all inputs with data-placeholder attribute
    document.querySelectorAll('[data-placeholder]').forEach(input => {
    const key = input.getAttribute('data-placeholder');
    if (translations[state.getLanguage()] && translations[state.getLanguage()][key]) {
        input.placeholder = translations[state.getLanguage()][key];
        }
    });
}

window.updateApiKey = function () {
    const input = document.getElementById("apiKeyInput");
    var apiKey = input.value;
    console.log("API Key updated:", apiKey);
    state.setClient(apiKey);
};

//set language
window.updateLanguage = function() {
    const select = document.getElementById("languageSelect");
    state.setLanguage(select.value);
    updateUILanguage();
};

//set country
window.updateCountry = function() {
    const select = document.getElementById("countrySelect");
    state.setCountry(select.value);
};

// Player management functions
window.addPlayerInput = function() {
    if (document.querySelectorAll('.player-config').length >= 6) {
        alert(translations[state.getLanguage()]["Maximum 6 players allowed!"]);
        return;
    }
    
    const playerInputs = document.getElementById("playerInputs");
    
    const playerDiv = document.createElement("div");
    playerDiv.className = "player-config";
    playerDiv.innerHTML = `
        <input type="text" placeholder="${translations[state.getLanguage()]["Player name"]}" class="player-name">
        <input type="number" placeholder="${translations[state.getLanguage()]["Age"]}  " min="1" max="99" class="player-age">
    `;
    
    playerInputs.appendChild(playerDiv);
};

window.startGame = function() {
    //check client
    if (!state.getClient()) {
        alert(translations[state.getLanguage()]["Please enter your OpenAI API key first!"]);
        return;
    }
    
    // Collect player information
    const playerConfigs = document.querySelectorAll('.player-config');
    
    playerConfigs.forEach(config => {
        const nameInput = config.querySelector('.player-name');
        const ageInput = config.querySelector('.player-age');
        
        if (nameInput.value.trim() && ageInput.value) {
            state.addPlayer({
                name: nameInput.value.trim(),
                age: parseInt(ageInput.value)
            });
        }
    });
    
    if (state.getNrPlayers() === 0) {
        alert(translations[state.getLanguage()]["Please add at least one player."]);
        return;
    }
    
    // Hide config screen, show game screen
    document.getElementById("playerConfigScreen").style.display = "none";
    document.getElementById("gameScreen").style.display = "block";
    
    // instruct AI
    state.addMessage(createSystemPrompt());

    // Create player buttons
    createPlayerButtons();
    
    // Set first player as active
    state.setCurrentPlayerIndex(0);
    updateActivePlayer();
};

function createPlayerButtons() {
    const playerButtonsContainer = document.getElementById("playerButtons");
    playerButtonsContainer.innerHTML = "";
    
    state.getPlayers().forEach((player, index) => {
        const button = document.createElement("button");
        button.className = "player-button";
        button.textContent = player.name;
        button.onclick = () => {
            state.setCurrentPlayerIndex(index);
            updateActivePlayer();
        };
        
        playerButtonsContainer.appendChild(button);
    });
}

function updateActivePlayer() {
    const playerButtons = document.querySelectorAll('.player-button');
    playerButtons.forEach((button, index) => {
        if (index === state.getCurrentPlayerIndex()) {
            button.classList.add('active-player');
        } else {
            button.classList.remove('active-player');
        }
    });
}

window.getCurrentPlayer = function() {
    return state.getCurrentPlayer();
};

window.showAnswer = function() {
    questionDisplay.textContent = state.getAnswerDisplay();
};

window.getQuestion = async function(color, name, age) {
    try {
        const questionDisplay = document.getElementById("questionDisplay");
        
        // Show loading state
        questionDisplay.textContent = translations[state.getLanguage()]["Loading question..."];
        
        // Make sure answer is hidden when getting a new question
        document.getElementById("showAnswerBtn").textContent = translations[state.getLanguage()]["Show Answer"];
        
        state.addMessage(
            {
                role: "user",
                content: `${name} a question for a ${age} old ${color}`
            }
        );
        
        const response = await state.getClient().chat.completions.create({
            model: "gpt-4.5-preview",
            messages: state.getMessages(),
            temperature: 0.65,
            max_tokens: 150,
        });

        const responseContent = response.choices[0].message.content;
        console.log("API Response:", responseContent);
        
        // Remove the last message from the messages array and anything after 40 or so moves (saves tokens)
        state.pruneMessages();
        
        // remove the json markup from the assistent prompt to save token
        const jsonResponse = JSON.parse(responseContent);

        // so that same question won't come back the first 40 moves at least
        state.addQuestionToPrompt(jsonResponse.question);

        // Update the question display
        state.setAnswerDisplay(jsonResponse.answer);

        // Show the question
        state.setQueryDisplay(jsonResponse.question);
        questionDisplay.textContent = state.getQueryDisplay();

    } catch (error) {
        console.error("Error getting question:", error);
        document.getElementById("questionDisplay").textContent = 
            "Error: " + error.message;
    }
};

// Initialize the game
document.addEventListener("DOMContentLoaded", function() {
    // Any initialization code can go here
      // Set default language
      state.setLanguage(document.getElementById("languageSelect").value);
    
      // Initialize UI language
      if (document.getElementById("gameScreen")) {
          updateUILanguage();
      }
});
