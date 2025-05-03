// Trivial Pursuit Game
import { translations } from "./language.js";
import { state } from "./state.js";

// Now returns only the system instruction string
window.createSystemPrompt = function () {
    // Note: Explicitly asking for JSON format here is still good practice,
    // even though we also use responseMimeType. It reinforces the instruction.
    return `You are a Trivial Pursuit box.
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
- Avoid questions about their colours, it's inappropriate.
- Do not repeat questions!!!
- Return your response *only* in this JSON format, with no other text before or after the JSON structure:
{
  "question": "Wat is de hoofdstad van Frankrijk?",
  "answer": "Parijs"
}`;
};

window.updateUILanguage = function () {
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[state.getLanguage()] && translations[state.getLanguage()][key]) {
            // Use innerText for potentially user-facing text elements, textContent is slightly faster but ignores CSS hide/show
            element.innerText = translations[state.getLanguage()][key];
        }
    });

    // Update category buttons
    document.querySelectorAll('[data-category]').forEach(button => {
        const category = button.getAttribute('data-category');
        // Use innerText here too
        button.innerText = translations[state.getLanguage()][category] || category;
    });

    // Update all inputs with data-placeholder attribute
    document.querySelectorAll('[data-placeholder]').forEach(input => {
        const key = input.getAttribute('data-placeholder');
        if (translations[state.getLanguage()] && translations[state.getLanguage()][key]) {
            input.placeholder = translations[state.getLanguage()][key];
        }
    });

    // Update other UI text elements if needed (e.g., button text not covered by categories)
     const showAnswerBtn = document.getElementById("showAnswerBtn");
     if (showAnswerBtn) {
         showAnswerBtn.innerText = translations[state.getLanguage()]["Show Answer"];
     }
      const addPlayerBtn = document.getElementById("addPlayerBtn"); // Assuming your add player button has this ID
      if (addPlayerBtn) {
          addPlayerBtn.innerText = translations[state.getLanguage()]["Add Player"];
      }
       const startGameBtn = document.getElementById("startGameBtn"); // Assuming your start game button has this ID
       if (startGameBtn) {
           startGameBtn.innerText = translations[state.getLanguage()]["Start Game"];
       }
        // Update loading text placeholder potentially? Or handle it directly in getQuestion
}


window.updateApiKey = function () {
    const input = document.getElementById("apiKeyInput");
    var apiKey = input.value;
    console.log("API Key updating..."); // Log before setting
    state.setClient(apiKey); // This now initializes GoogleGenerativeAI
     // Optional: Check if initialization was successful
     if (state.getGenAI()) {
         console.log("Google AI Client seems ready.");
         // Maybe enable start game button here if it was disabled
     } else {
         console.error("Google AI Client initialization failed. Check API Key.");
         alert(translations[state.getLanguage()]["API Key Invalid or Missing"]);
     }
};

//set language
window.updateLanguage = function () {
    const select = document.getElementById("languageSelect");
    state.setLanguage(select.value);
    // Clear previous game state like messages and question display when language changes
    document.getElementById("questionDisplay").textContent = "";
    state.setMessages([]);
    state.setAnswerDisplay("");
    state.setQueryDisplay("");
    updateUILanguage(); // Update UI text
    console.log(`Language changed to: ${state.getLanguage()}`);
};

//set country
window.updateCountry = function () {
    const select = document.getElementById("countrySelect");
    state.setCountry(select.value);
     // Clear previous game state like messages and question display when country changes
     document.getElementById("questionDisplay").textContent = "";
     state.setMessages([]);
     state.setAnswerDisplay("");
     state.setQueryDisplay("");
    console.log(`Country changed to: ${state.getCountry()}`);
};

// Player management functions
window.addPlayerInput = function () {
    if (document.querySelectorAll('.player-config').length >= 6) {
        alert(translations[state.getLanguage()]["Maximum 6 players allowed!"]);
        return;
    }

    const playerInputs = document.getElementById("playerInputs");

    const playerDiv = document.createElement("div");
    playerDiv.className = "player-config";
    // Use translated placeholders
    playerDiv.innerHTML = `
        <input type="text" placeholder="${translations[state.getLanguage()]["Player name"]}" class="player-name">
        <input type="number" placeholder="${translations[state.getLanguage()]["Age"]}" min="1" max="99" class="player-age">
    `;

    playerInputs.appendChild(playerDiv);
};

window.startGame = function () {
    // Check client (now checks for the genAI instance)
    if (!state.getGenAI()) {
        // Use translated alert
        alert(translations[state.getLanguage()]["Please enter your Google API key first!"]);
        return;
    }

    // Collect player information
    const playerConfigs = document.querySelectorAll('.player-config');
    state.setPlayers([]); // Clear existing players before adding new ones

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

    // *** No need to add system prompt to messages here for Gemini ***
    // The system prompt is passed separately in the API call.
    // Clear any previous messages just in case
    state.setMessages([]);

    // Create player buttons
    createPlayerButtons();

    // Set first player as active
    state.setCurrentPlayerIndex(0);
    updateActivePlayer();
};

function createPlayerButtons() {
    const playerButtonsContainer = document.getElementById("playerButtons");
    playerButtonsContainer.innerHTML = ""; // Clear existing buttons

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
     // Update the current player display text if you have one
     const currentPlayerDisplay = document.getElementById("currentPlayerDisplay"); // Assume you have an element with this ID
     const currentPlayer = state.getCurrentPlayer();
     if (currentPlayerDisplay && currentPlayer) {
         currentPlayerDisplay.textContent = `${translations[state.getLanguage()]["Current Player"]}: ${currentPlayer.name} (${currentPlayer.age})`;
     }
     // Reset question display when player changes
     document.getElementById("questionDisplay").textContent = "";
     document.getElementById("showAnswerBtn").style.display = 'none'; // Hide show answer button initially
}


window.getCurrentPlayer = function () {
    return state.getCurrentPlayer();
};

window.showAnswer = function () {
    const questionDisplay = document.getElementById("questionDisplay");
    questionDisplay.textContent = state.getAnswerDisplay();
    // Optionally hide the button after showing the answer
    // document.getElementById("showAnswerBtn").style.display = 'none';
};

window.getQuestion = async function (color, name, age) {
    const genAI = state.getGenAI(); // Get the initialized GoogleGenerativeAI instance
    if (!genAI) {
         console.error("Google AI Client not initialized.");
         document.getElementById("questionDisplay").textContent = translations[state.getLanguage()]["API Key Invalid or Missing"];
         return;
    }

    const questionDisplay = document.getElementById("questionDisplay");
    const showAnswerBtn = document.getElementById("showAnswerBtn");

    try {
        // Show loading state
        questionDisplay.textContent = translations[state.getLanguage()]["Loading question..."];
        showAnswerBtn.style.display = 'none'; // Hide answer button while loading
        showAnswerBtn.textContent = translations[state.getLanguage()]["Show Answer"]; // Reset button text

        // 1. Prepare the user message for this request
        const userMessageContent = `${name} a question for a ${age} year old ${color}`;
        const userMessageForAPI = { role: "user", text: userMessageContent };

        // 2. Add the user message to the state *before* the API call
        state.addMessage(userMessageForAPI);

         // 3. Get the system instruction string
         const systemInstructionContent = createSystemPrompt();

        // 4. Define Generation Configuration
        const generationConfig = {
            temperature: 0.7, // Adjusted slightly, Gemini might behave differently
            maxOutputTokens: 1000, // Generous limit for Q&A JSON
            // Crucially, enforce JSON output
            responseMimeType: 'application/json',
        };

        // 5. Get the model instance with system instructions and config
         const model = genAI.getGenerativeModel({
             model: "gemini-2.5-pro-exp-03-25", // Use the desired Gemini model
             systemInstruction: systemInstructionContent,
             generationConfig: generationConfig
         });

        // 6. Make the API call using generateContent
        // Pass the history (which includes the latest user prompt)
        console.log("Calling Gemini API...");
        const result = await model.generateContent({ contents: state.getMessages() });
        console.log("Gemini API Response:", result);
        const response = await result.response;

        console.log("Gemini API Response raw:", response);
        const responseContentText = response.text(); // This should be the JSON string
        console.log("API Response Content (expecting JSON string):", responseContentText);

        // 7. Prune messages *after* the call, removing the user prompt we added
        state.pruneMessages(); // Should remove the last user message

        // 8. Parse the JSON response
        // Gemini with responseMimeType should return just the JSON string
        let jsonResponse;
        console.log("Attempting to parse JSON response... "+responseContentText);
        try {
             jsonResponse = JSON.parse(responseContentText);
        } catch(parseError) {
            console.error("Failed to parse JSON response:", parseError);
            console.error("Received text was:", responseContentText);
            questionDisplay.textContent = `${translations[state.getLanguage()]["Error"]}: ${translations[state.getLanguage()]["Invalid response format."]}`;
            return; // Stop processing if parsing failed
        }

        // 9. Add the AI's *actual* response (the question part) to history to avoid repeats
        // We add the question text, not the full JSON, to simulate conversation flow
        if (jsonResponse.question) {
             // state.addQuestionToPrompt now uses {role: 'model', text: ...}
             state.addQuestionToPrompt(jsonResponse.question);
        } else {
             console.warn("JSON response missing 'question' field:", jsonResponse);
        }

        // 10. Update state and UI
        state.setAnswerDisplay(jsonResponse.answer || translations[state.getLanguage()]["No answer provided"]); // Handle missing answer
        state.setQueryDisplay(jsonResponse.question || translations[state.getLanguage()]["No question provided"]); // Handle missing question
        questionDisplay.textContent = state.getQueryDisplay();
        showAnswerBtn.style.display = 'inline-block'; // Show the answer button

    } catch (error) {
        console.error("Error getting question from Gemini:", error);
         // Check for specific API errors if possible
         let errorMessage = error.message;
         if (error.toString().includes("API key not valid")) {
            errorMessage = translations[state.getLanguage()]["API Key Invalid or Missing"];
         } else if (error.toString().includes("quota")) {
             errorMessage = translations[state.getLanguage()]["API Quota Exceeded"];
         } else {
             errorMessage = translations[state.getLanguage()]["Error fetching question"];
         }
        questionDisplay.textContent = `${translations[state.getLanguage()]["Error"]}: ${errorMessage}`;
        showAnswerBtn.style.display = 'none'; // Hide button on error
    }
};

// Initialize the game
document.addEventListener("DOMContentLoaded", function () {
    // Set default language from dropdown
    const langSelect = document.getElementById("languageSelect");
    if (langSelect) {
        state.setLanguage(langSelect.value);
    } else {
         state.setLanguage("English"); // Fallback default
    }

    // Set default country from dropdown
    const countrySelect = document.getElementById("countrySelect");
    if (countrySelect) {
        state.setCountry(countrySelect.value);
    } else {
        state.setCountry("USA"); // Fallback default
    }


    // Initialize UI language only if the game screen elements are present
    // This prevents errors if only the config screen is initially visible
    if (document.getElementById("playerConfigScreen") || document.getElementById("gameScreen")) {
        updateUILanguage();
    } else {
        console.log("Initial UI language update skipped (elements not found).");
    }

     // Add event listeners for API key input (e.g., on button click or input change)
     const apiKeyButton = document.getElementById("apiKeyButton"); // Assume you have a button
     const apiKeyInput = document.getElementById("apiKeyInput");
     if (apiKeyButton) {
         apiKeyButton.onclick = window.updateApiKey;
     } else if (apiKeyInput) {
         // Update on losing focus (blur) or pressing Enter
         apiKeyInput.addEventListener('blur', window.updateApiKey);
         apiKeyInput.addEventListener('keypress', (e) => {
             if (e.key === 'Enter') {
                 window.updateApiKey();
             }
         });
     }

      // Add player button listener
     const addPlayerBtn = document.getElementById("addPlayerBtn");
     if (addPlayerBtn) {
         addPlayerBtn.onclick = window.addPlayerInput;
     }

     // Start game button listener
     const startGameBtn = document.getElementById("startGameBtn");
     if (startGameBtn) {
         startGameBtn.onclick = window.startGame;
     }

     // Language and Country select listeners
     const languageSelect = document.getElementById("languageSelect");
     if (languageSelect) {
         languageSelect.onchange = window.updateLanguage;
     }
      const countrySelectElem = document.getElementById("countrySelect"); // Renamed to avoid conflict
      if (countrySelectElem) {
          countrySelectElem.onchange = window.updateCountry;
      }

     // Category button listeners (assuming they are present in the HTML)
     document.querySelectorAll('.category-button').forEach(button => {
         button.onclick = () => {
             const color = button.getAttribute('data-category');
             const player = state.getCurrentPlayer();
             if (player) {
                 window.getQuestion(color, player.name, player.age);
             } else {
                 console.error("No current player selected.");
                  alert(translations[state.getLanguage()]["Please select a player."]); // Or handle appropriately
             }
         };
     });

     // Show answer button listener
     const showAnswerBtn = document.getElementById("showAnswerBtn");
     if (showAnswerBtn) {
         showAnswerBtn.onclick = window.showAnswer;
          showAnswerBtn.style.display = 'none'; // Initially hidden
     }

});