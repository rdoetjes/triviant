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

// Assumed globals/accessible variables: state, translations, document

/**
 * Updates the UI elements to indicate that a question is being loaded.
 */
function showLoadingStateUI() {
    const questionDisplay = document.getElementById("questionDisplay");
    const showAnswerBtn = document.getElementById("showAnswerBtn");
    const lang = state.getLanguage(); // Assuming state object is accessible

    questionDisplay.textContent = translations[lang]["Loading question..."];
    showAnswerBtn.textContent = translations[lang]["Show Answer"];
    // Consider adding a visual loading indicator (spinner, etc.) here too
}

/**
 * Builds the user message object for the API call.
 * @param {string} color
 * @param {string} name
 * @param {string} age
 * @returns {object} The user message object.
 */
function buildUserMessage(color, name, age) {
    return {
        role: "user",
        content: `${name} a question for a ${age} old ${color}` // Corrected typo "questoin" -> "question"
    };
}

/**
 * Calls the chat completions API.
 * @returns {Promise<object>} The API response object.
 * @throws {Error} If the API call fails.
 */
async function fetchChatCompletion() {
    // Add the user message just before the call
    // Note: The original code added the message *before* calling create.
    // If buildUserMessage is called outside, ensure state.addMessage is called before this.
    
    // Let's stick to the original logic flow where the main function adds the message first.
    
    return await state.getClient().chat.completions.create({ // Assuming state object is accessible
        model: "gpt-4.5-preview", // Consider making this configurable
        messages: state.getMessages(),
        temperature: 0.65,         // Consider making this configurable
        max_tokens: 150,           // Consider making this configurable
    });
}

/**
 * Processes the successful API response, updates state, and displays the question.
 * @param {string} responseContent - The raw content string from the API response.
 */
function processAndDisplayResponse(responseContent) {
    console.log("API Response:", responseContent);

    // Remove the last message (assistant response) before processing
    // And prune older messages if needed
    state.pruneMessages(); // Assuming state object is accessible

    // Parse the JSON response
    // Add error handling for potentially invalid JSON
    let jsonResponse;
    try {
        jsonResponse = JSON.parse(responseContent);
    } catch (parseError) {
        console.error("Error parsing API response JSON:", parseError);
        // Re-throw or handle appropriately, maybe show an error UI
        throw new Error("Failed to parse response from AI."); 
    }

    // Add the new question to the prompt history to avoid immediate repeats
    state.addQuestionToPrompt(jsonResponse.question);

    // Update the answer in the state
    state.setAnswerDisplay(jsonResponse.answer);

    // Update and display the question
    state.setQueryDisplay(jsonResponse.question);
    displayQuestionUI(state.getQueryDisplay());
}

/**
 * Updates the UI to display the received question.
 * @param {string} questionText - The question text to display.
 */
function displayQuestionUI(questionText) {
    const questionDisplay = document.getElementById("questionDisplay");
    questionDisplay.textContent = questionText;
}

/**
 * Handles errors that occur during the question fetching process.
 * @param {Error} error - The error object.
 */
function handleGetQuestionError(error) {
    console.error("Error getting question:", error);
    const questionDisplay = document.getElementById("questionDisplay");
    // Provide a user-friendly error message
    questionDisplay.textContent = translations[state.getLanguage()]["Error fetching question"] || `Error: ${error.message}`; // Fallback
}

// --- The Main Orchestrator Function ---

window.getQuestion = async function(color, name, age) {
    // 1. Check if already running (Guard Clause)
    if (state.getQueryRunning()) {
        console.log("Query already running, returning.");
        return;
    }

    try {
        // 2. Set running state and update UI to loading
        state.setQuerRunning(true);
        showLoadingStateUI();

        // 3. Prepare and add the user message to state
        const userMessage = buildUserMessage(color, name, age);
        state.addMessage(userMessage);

        // 4. Fetch data from API
        const response = await fetchChatCompletion();
        const responseContent = response.choices[0]?.message?.content; // Safer access

        if (!responseContent) {
           throw new Error("Received empty response content from API.");
        }

        // 5. Process the successful response
        processAndDisplayResponse(responseContent);

    } catch (error) {
        // 6. Handle any errors during the process
        handleGetQuestionError(error);        
    } finally {
        // 7. Always reset the running state
        state.setQuerRunning(false);
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
