// Section navigation
function showSection(sectionName) {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    document.getElementById(sectionName).classList.add('active');
    
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        link.style.color = '#fff';
    });
    
    window.scrollTo(0, 0);

    // Show interstitial ad when changing sections
    if (Math.random() < 0.3) { // 30% chance
        showInterstitialAd();
    }
}

// Game functionality
function playGame(gameId) {
    const gameMap = {
        "flappy": "games/flappy/index.html",
        "2048": "games/2048/index.html",
        "snake": "games/snake/snaki.html",
        "memory": "games/memory/index.html",
        "chess": "games/chess/index.html",
        "checkers": "games/checkers/index.html",
        "plinko": "games/plinko/index.html",
        "slots": "games/slots/index.html",
        "blackjack": "games/blackjack/index.html",
        "breakout": "games/breakout/index.html",
        "minesweeper": "games/minesweeper/index.html",
    };

    const gameUrl = gameMap[gameId];
    if (!gameUrl) {
        showNotification("Game coming soon!", 'info');
        return;
    }

    document.getElementById("game-frame").src = gameUrl;
    document.getElementById("game-modal").style.display = "flex";
    
    // Show rewarded ad option
    setTimeout(() => {
        if (confirm("Watch a short ad to double your potential winnings for this game?")) {
            showNotification("🎯 Winnings multiplier activated! Good luck!", 'success');
        }
    }, 2000);
}

function closeGame() {
    document.getElementById("game-frame").src = "";
    document.getElementById("game-modal").style.display = "none";
    
    // Show end-game ad
    setTimeout(() => {
        showNotification("Great game! Check out today's competitions!", 'info');
    }, 500);
}

// Ad simulation functions
function showInterstitialAd() {
    showNotification("📱 [Interstitial Ad Shown]", 'info');
}

function showRewardedAd() {
    showNotification("🎬 [Rewarded Video Ad] +0.1 TON bonus!", 'success');
}

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 2rem;
        border-radius: 10px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        max-width: 300px;
        word-wrap: break-word;
    `;
    
    switch(type) {
        case 'success':
            notification.style.background = 'linear-gradient(45deg, #4ecdc4, #45b7d1)';
            break;
        case 'error':
            notification.style.background = 'linear-gradient(45deg, #ff6b6b, #ff5722)';
            break;
        case 'info':
            notification.style.background = 'linear-gradient(45deg, #667eea, #764ba2)';
            break;
    }
    
    notification.style.color = 'white';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

function showUserProfile() {
    showNotification('Please login with Telegram to view profile', 'info');
}

// Header scroll effect
window.addEventListener('scroll', function() {
    const header = document.querySelector('header');
    if (window.scrollY > 100) {
        header.style.background = 'rgba(0, 0, 0, 0.95)';
    } else {
        header.style.background = 'rgba(0, 0, 0, 0.9)';
    }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Initialize card animations
    const cards = document.querySelectorAll('.game-card, .competition-card');
    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    });
    
    // Animate cards on scroll
    function animateOnScroll() {
        cards.forEach(card => {
            const rect = card.getBoundingClientRect();
            const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
            
            if (isVisible) {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }
        });
    }
    
    window.addEventListener('scroll', animateOnScroll);
    window.addEventListener('load', animateOnScroll);
    animateOnScroll(); // Initial check

    // Simulate ad revenue tracking
    setTimeout(() => {
        console.log('Ad impressions: 12, RPM: $3.20, Revenue: $0.038');
    }, 5000);
});

// Game score submission
window.addEventListener('message', function(event) {
    if (event.data.type === 'gameComplete') {
        const { game, score, data, wallet, timestamp } = event.data;
    
        // Basic validation
        if (validateScore(game, score, data)) {
            // Send to your backend
            fetch('/submit-score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    wallet: wallet,
                    game: game,
                    score: score,
                    gameData: data,
                    timestamp: timestamp
                })
            }).then(response => {
                if (response.ok) {
                    showNotification(`Score ${score} saved for ${game}!`, 'success');
                }
            });
        }
    }
});

function validateScore(game, score, data) {
    // Basic anti-cheat validation
    switch(game) {
        case 'breakout':
            // Check if score is reasonable for time played
            const maxScorePerSecond = 50;
            const gameTimeSeconds = data.gameTime / 1000;
            return score <= (maxScorePerSecond * gameTimeSeconds);
        // Add other games...
    }
    return true;

}
/*
test
*/
// ==== Авторизация через Telegram ====
function onTelegramAuth(user) {
    localStorage.setItem("telegramUser", JSON.stringify(user));
    renderUserProfile(user);
    showSection("account"); // сразу открыть аккаунт
}

// Рендер кнопки/аватара в хедере
function renderUserProfile(user) {
    const authContainer = document.getElementById("auth-container");
    authContainer.innerHTML = `
        <div class="user-info" style="display:flex;align-items:center;gap:10px;">
            <img src="${user.photo_url}" style="width:40px; height:40px; border-radius:50%;" />
            <span>${user.first_name}</span>
            <button onclick="logout()" style="margin-left:10px; padding:4px 8px; border:none; background:#ff4444; color:white; border-radius:5px; cursor:pointer;">Log out</button>
        </div>
    `;
    renderAccountPage(user);
}

// Рендер секции "Аккаунт"
function renderAccountPage(user) {
    const wallet = localStorage.getItem("userWallet") || "";
    document.getElementById("account-info").innerHTML = `
        <div style="margin-bottom:15px;">
            <img src="${user.photo_url}" style="width:60px; height:60px; border-radius:50%;" />
            <h3>${user.first_name} ${user.last_name || ""}</h3>
            <p><strong>ID:</strong> ${user.id}</p>
        </div>
        <hr>
        <h3>💳 Кошелёк TON</h3>
        <input type="text" id="wallet" value="${wallet}" placeholder="Введите адрес кошелька" style="width:300px; padding:6px;" />
        <button onclick="saveWallet()" style="margin-left:5px;">Сохранить</button>
        <p id="wallet-status" style="margin-top:10px;"></p>
    `;
}

// Сохранение кошелька
function saveWallet() {
    const wallet = document.getElementById("wallet").value.trim();
    if (!wallet) {
        document.getElementById("wallet-status").textContent = "Введите адрес!";
        return;
    }
    localStorage.setItem("userWallet", wallet);
    document.getElementById("wallet-status").textContent = "Кошелёк сохранён ✅";
}

// Выход
function logout() {
    localStorage.removeItem("telegramUser");
    localStorage.removeItem("userWallet");
    location.reload(); // обновляем страницу, чтобы вернулась кнопка логина
}

// ==== При загрузке страницы ====
document.addEventListener("DOMContentLoaded", () => {
    const storedUser = localStorage.getItem("telegramUser");
    if (storedUser) {
        const user = JSON.parse(storedUser);
        renderUserProfile(user);
    }
});


