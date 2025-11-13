// Game State
let currentWord = '';
let currentWordData = null;
let guessedLetters = [];
let wrongGuesses = 0;
const maxWrongGuesses = 6;
let gameActive = false;
let hintUsed = false;

// Scoring & Rounds
let currentRound = 0;
let totalScore = 0;
let wordsSolved = 0;
let totalGuesses = 0;
let correctGuesses = 0;
let startTime = null;
let timerInterval = null;
const POINTS_PER_WORD = 10;
const TIME_BONUS = 10;
const TIME_LIMIT_FOR_BONUS = 300; // 5 minutes in seconds
const MAX_ROUNDS = 10;

// Audio
const bgMusic = document.getElementById('bgMusic');
let audioEnabled = false;

// Word Bank - Will be loaded from JSON
let wordBank = [];
let selectedCategory = 'programming';
let selectedDifficulty = 'easy';

// Hangman body parts in order
const bodyParts = ['head', 'body', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg'];

// DOM Elements
const homeScreen = document.getElementById('homeScreen');
const gameScreen = document.getElementById('gameScreen');
const playBtn = document.getElementById('playBtn');
const howToPlayBtn = document.getElementById('howToPlayBtn');
const audioBtn = document.getElementById('audioBtn');
const backBtn = document.getElementById('backBtn');
const restartBtn = document.getElementById('restartBtn');
const skipBtn = document.getElementById('skipBtn');
const categorySelect = document.getElementById('categorySelect');
const difficultySelect = document.getElementById('difficultySelect');
const wordDisplay = document.getElementById('wordDisplay');
const keyboard = document.getElementById('keyboard');
const livesCount = document.getElementById('livesCount');
const currentScoreDisplay = document.getElementById('currentScore');
const currentRoundDisplay = document.getElementById('currentRound');
const timerDisplay = document.getElementById('timer');
const categoryDisplay = document.getElementById('categoryDisplay');
const hintDisplay = document.getElementById('hintDisplay');
const hintBtn = document.getElementById('hintBtn');
const educationalInfo = document.getElementById('educationalInfo');
const howToPlayModal = document.getElementById('howToPlayModal');
const gameOverModal = document.getElementById('gameOverModal');
const gameCompleteModal = document.getElementById('gameCompleteModal');
const closeBtn = document.querySelector('.close-btn');
const nextWordBtn = document.getElementById('nextWordBtn');
const playNewGameBtn = document.getElementById('playNewGameBtn');
const homeFromCompleteBtn = document.getElementById('homeFromCompleteBtn');

// Load words from JSON
async function loadWords(category, difficulty) {
    try {
        const fileName = `words/${category}-${difficulty}.json`;
        const response = await fetch(fileName);
        const data = await response.json();
        wordBank = data.words;
        console.log(`Words loaded from ${fileName}:`, wordBank);
        return true;
    } catch (error) {
        console.error('Error loading words:', error);
        // Fallback words if JSON fails to load
        wordBank = [
            {
                word: 'JAVASCRIPT',
                category: 'Programming',
                hint: 'A popular web programming language',
                educational: 'JavaScript makes websites interactive.'
            },
            {
                word: 'ALGORITHM',
                category: 'Computer Science',
                hint: 'Step-by-step problem solving procedure',
                educational: 'Algorithms are the foundation of programming.'
            }
        ];
        return false;
    }
}

// Initialize Keyboard
function createKeyboard() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    keyboard.innerHTML = '';
    
    letters.forEach(letter => {
        const key = document.createElement('button');
        key.className = 'key';
        key.textContent = letter;
        key.addEventListener('click', () => handleGuess(letter, key));
        keyboard.appendChild(key);
    });
}

// Start New Game
function startNewGame() {
    // Get selected category and difficulty
    selectedCategory = categorySelect.value;
    selectedDifficulty = difficultySelect.value;
    
    // Reset game state
    currentRound = 0;
    totalScore = 0;
    wordsSolved = 0;
    totalGuesses = 0;
    correctGuesses = 0;
    
    // Update UI
    currentScoreDisplay.textContent = totalScore;
    
    // Show game screen
    homeScreen.classList.remove('active');
    gameScreen.classList.add('active');
    
    // Load words and start first round
    loadWords(selectedCategory, selectedDifficulty).then(() => {
        startNewRound();
    });
}

// Start New Round
function startNewRound() {
    if (currentRound >= MAX_ROUNDS) {
        showGameComplete();
        return;
    }
    
    currentRound++;
    currentWordData = wordBank[currentRound - 1]; // Use words in order from JSON
    currentWord = currentWordData.word.toUpperCase();
    guessedLetters = [];
    wrongGuesses = 0;
    gameActive = true;
    hintUsed = false;
    
    // Reset timer
    if (timerInterval) clearInterval(timerInterval);
    startTime = Date.now();
    updateTimer();
    timerInterval = setInterval(updateTimer, 1000);
    
    // Reset UI
    currentRoundDisplay.textContent = currentRound;
    livesCount.textContent = maxWrongGuesses;
    categoryDisplay.textContent = currentWordData.category;
    hintDisplay.classList.remove('visible');
    hintDisplay.textContent = '';
    hintBtn.textContent = '💡 Show Hint';
    createKeyboard();
    displayWord();
    resetHangman();
}

// Update Timer
function updateTimer() {
    if (!gameActive) return;
    
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Display Word
function displayWord() {
    wordDisplay.innerHTML = '';
    
    for (let letter of currentWord) {
        const letterBox = document.createElement('div');
        letterBox.className = 'letter-box';
        
        if (guessedLetters.includes(letter)) {
            letterBox.textContent = letter;
        } else {
            letterBox.textContent = '';
        }
        
        wordDisplay.appendChild(letterBox);
    }
}

// Handle Guess
function handleGuess(letter, keyElement) {
    if (!gameActive || keyElement.classList.contains('used')) return;
    
    keyElement.classList.add('used');
    guessedLetters.push(letter);
    totalGuesses++;
    
    if (currentWord.includes(letter)) {
        // Correct guess
        keyElement.classList.add('correct');
        correctGuesses++;
        displayWord();
        checkWin();
    } else {
        // Wrong guess
        keyElement.classList.add('wrong');
        wrongGuesses++;
        updateHangman();
        livesCount.textContent = maxWrongGuesses - wrongGuesses;
        
        if (wrongGuesses >= maxWrongGuesses) {
            endGame(false);
        }
    }
}

// Update Hangman Drawing
function updateHangman() {
    if (wrongGuesses <= bodyParts.length) {
        const part = document.getElementById(bodyParts[wrongGuesses - 1]);
        part.classList.remove('hidden');
        part.classList.add('show');
    }
}

// Reset Hangman
function resetHangman() {
    bodyParts.forEach(partId => {
        const part = document.getElementById(partId);
        part.classList.remove('show');
        part.classList.add('hidden');
    });
}

// Check Win Condition
function checkWin() {
    const allLettersGuessed = currentWord.split('').every(letter => 
        guessedLetters.includes(letter)
    );
    
    if (allLettersGuessed) {
        endGame(true);
    }
}

// End Game
function endGame(won) {
    gameActive = false;
    if (timerInterval) clearInterval(timerInterval);
    
    const gameOverMessage = document.getElementById('gameOverMessage');
    
    if (won) {
        // Calculate score
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        let roundScore = POINTS_PER_WORD;
        
        if (elapsed <= TIME_LIMIT_FOR_BONUS) {
            roundScore += TIME_BONUS;
        }
        
        totalScore += roundScore;
        wordsSolved++;
        currentScoreDisplay.textContent = totalScore;
        
        gameOverMessage.innerHTML = `
            <div class="win-message">
                🎉 CORRECT! 🎉<br>
                <span style="font-size: 1.5rem; color: #4ade80;">The word was: ${currentWord}</span><br>
                <span style="font-size: 1.3rem; color: #b8b8b8;">+${roundScore} points!</span>
                ${elapsed <= TIME_LIMIT_FOR_BONUS ? '<br><span style="font-size: 1rem; color: #ffa500;">⚡ Time Bonus!</span>' : ''}
            </div>
        `;
    } else {
        gameOverMessage.innerHTML = `
            <div class="lose-message">
                💀 FAILED 💀<br>
                <span style="font-size: 1.5rem; color: #b8b8b8;">The word was: ${currentWord}</span><br>
                <span style="font-size: 1.3rem; color: #e94560;">+0 points</span>
            </div>
        `;
    }
    
    // Show educational information
    educationalInfo.innerHTML = `<strong>📚 Did you know?</strong> ${currentWordData.educational}`;
    
    gameOverModal.classList.add('active');
}

// Show Game Complete Screen
function showGameComplete() {
    gameScreen.classList.remove('active');
    
    const finalScoreDisplay = document.getElementById('finalScore');
    const wordsSolvedDisplay = document.getElementById('wordsSolved');
    const accuracyDisplay = document.getElementById('accuracy');
    const performanceMessage = document.getElementById('performanceMessage');
    
    finalScoreDisplay.textContent = totalScore;
    wordsSolvedDisplay.textContent = `${wordsSolved}/${MAX_ROUNDS}`;
    
    const accuracy = totalGuesses > 0 ? Math.round((correctGuesses / totalGuesses) * 100) : 0;
    accuracyDisplay.textContent = `${accuracy}%`;
    
    // Performance message
    let message = '';
    if (totalScore >= 180) {
        message = '🏆 LEGENDARY! You are a word master!';
    } else if (totalScore >= 150) {
        message = '⭐ EXCELLENT! Outstanding performance!';
    } else if (totalScore >= 100) {
        message = '👍 GOOD JOB! Keep it up!';
    } else if (totalScore >= 50) {
        message = '😊 NOT BAD! Room for improvement!';
    } else {
        message = '💪 KEEP TRYING! Practice makes perfect!';
    }
    
    performanceMessage.textContent = message;
    gameCompleteModal.classList.add('active');
}

// Audio Controls
audioBtn.addEventListener('click', () => {
    audioEnabled = !audioEnabled;
    
    if (audioEnabled) {
        bgMusic.play().catch(e => console.log('Audio play failed:', e));
        audioBtn.classList.remove('muted');
        audioBtn.querySelector('.audio-icon').textContent = '🔊';
    } else {
        bgMusic.pause();
        audioBtn.classList.add('muted');
        audioBtn.querySelector('.audio-icon').textContent = '🔇';
    }
});

// Event Listeners
playBtn.addEventListener('click', () => {
    startNewGame();
});

// Category and Difficulty change listeners
categorySelect.addEventListener('change', () => {
    selectedCategory = categorySelect.value;
});

difficultySelect.addEventListener('change', () => {
    selectedDifficulty = difficultySelect.value;
});

howToPlayBtn.addEventListener('click', () => {
    howToPlayModal.classList.add('active');
});

closeBtn.addEventListener('click', () => {
    howToPlayModal.classList.remove('active');
});

// Close modal when clicking outside
howToPlayModal.addEventListener('click', (e) => {
    if (e.target === howToPlayModal) {
        howToPlayModal.classList.remove('active');
    }
});

gameOverModal.addEventListener('click', (e) => {
    if (e.target === gameOverModal) {
        gameOverModal.classList.remove('active');
    }
});

backBtn.addEventListener('click', () => {
    gameScreen.classList.remove('active');
    homeScreen.classList.add('active');
    gameActive = false;
    if (timerInterval) clearInterval(timerInterval);
});

restartBtn.addEventListener('click', () => {
    startNewRound();
});

skipBtn.addEventListener('click', () => {
    if (gameActive) {
        endGame(false);
    }
});

nextWordBtn.addEventListener('click', () => {
    gameOverModal.classList.remove('active');
    startNewRound();
});

playNewGameBtn.addEventListener('click', () => {
    gameCompleteModal.classList.remove('active');
    startNewGame();
});

homeFromCompleteBtn.addEventListener('click', () => {
    gameCompleteModal.classList.remove('active');
    homeScreen.classList.add('active');
});

// Hint Button
hintBtn.addEventListener('click', () => {
    if (!gameActive) return;
    
    if (hintDisplay.classList.contains('visible')) {
        // Hide hint
        hintDisplay.classList.remove('visible');
        hintBtn.textContent = '💡 Show Hint';
    } else {
        // Show hint
        hintDisplay.textContent = currentWordData.hint;
        hintDisplay.classList.add('visible');
        hintBtn.textContent = '🔒 Hide Hint';
    }
});

// Keyboard Support
document.addEventListener('keydown', (e) => {
    if (!gameActive) return;
    
    const letter = e.key.toUpperCase();
    if (letter.length === 1 && letter >= 'A' && letter <= 'Z') {
        const keys = document.querySelectorAll('.key');
        keys.forEach(key => {
            if (key.textContent === letter && !key.classList.contains('used')) {
                handleGuess(letter, key);
            }
        });
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Set audio button to muted state initially
    audioBtn.classList.add('muted');
    audioBtn.querySelector('.audio-icon').textContent = '🔇';
    
    // Set initial selections
    selectedCategory = categorySelect.value;
    selectedDifficulty = difficultySelect.value;
});
