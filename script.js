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
    
    // Smooth scroll to top with mobile consideration
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Enhanced game functionality with mobile support
function playGame(gameId) {
    const gameMap = {
        "flappy": "games/flappy/index.html",
        "2048": "games/2048/index.html",
        "snake": "games/snake/snaki.html",
        "memory": "games/memory/index.html",
        "chess": "rea.html",
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

    // Lock screen orientation for mobile games if possible
    if (screen.orientation && screen.orientation.lock) {
        try {
            screen.orientation.lock('portrait').catch(() => {
                // Ignore if orientation lock fails
            });
        } catch (e) {
            // Ignore orientation lock errors
        }
    }

    document.getElementById("game-frame").src = gameUrl;
    document.getElementById("game-modal").style.display = "flex";
}

function closeGame() {
    document.getElementById("game-frame").src = "";
    document.getElementById("game-modal").style.display = "none";
    
    // Unlock orientation
    if (screen.orientation && screen.orientation.unlock) {
        try {
            screen.orientation.unlock();
        } catch (e) {
            // Ignore orientation unlock errors
        }
    }
    
    // Show end-game ad
    setTimeout(() => {
        showNotification("Great game! Check out today's competitions!", 'info');
    }, 500);
}

// Enhanced notification system with mobile support
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    
    // Check if mobile
    const isMobile = window.innerWidth <= 768;
    
    notification.style.cssText = `
        position: fixed;
        ${isMobile ? 'top: 80px; right: 10px; left: 10px; width: auto; max-width: none;' : 'top: 20px; right: 20px; max-width: 300px;'}
        padding: 1rem 2rem;
        border-radius: 10px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        word-wrap: break-word;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(10px);
    `;
    
    if (isMobile) {
        notification.classList.add('notification-mobile');
    }
    
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

// ==== Telegram Authorization ====
const API_URL = "https://backend-51rt.onrender.com"

async function onTelegramAuth(userData) {
  try {
    const payload = {
      telegram_id: userData.id,           // Telegram даёт id, а бэк ждёт telegram_id
      username: userData.username || null,
      first_name: userData.first_name,
      last_name: userData.last_name || null,
      photo_url: userData.photo_url || null,
    };

    const response = await fetch(`${API_URL}/auth/telegram`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.ok && data.user) {
      localStorage.setItem("telegramUser", JSON.stringify(data.user));
      console.log("User logged in:", data.user);
      renderUserProfile(data.user);
    } else {
      console.error("Login error:", data);
      showNotification("Login failed", "error");
    }
  } catch (error) {
    console.error("Fetch error:", error);
    showNotification("Network error", "error");
  }
}

// Render button/avatar in header
function renderUserProfile(user) {
    const authContainer = document.getElementById("auth-container");
    authContainer.innerHTML = `
        <div class="user-info">
            <img src="${user.photo_url}" style="width:40px; height:40px; border-radius:50%;" />
            <span>${user.first_name}</span>
            <button onclick="logout()">Log out</button>
        </div>
    `;
    renderAccountPage(user);
    showSection("account");
}

// Render "Account" section
function renderAccountPage(user) {
    const wallet = localStorage.getItem("userWallet") || "";
    document.getElementById("account-info").innerHTML = `
        <div class="account-profile">
            <img src="${user.photo_url}" style="width:80px; height:80px; border-radius:50%;" />
            <h3>${user.first_name} ${user.last_name || ""}</h3>
            <p><strong>Telegram ID:</strong> ${user.telegram_id}</p>
            <p><strong>Username:</strong> @${user.username || 'Not set'}</p>
        </div>
        
        <div class="wallet-section">
            <h3>TON Wallet</h3>
            <p style="margin-bottom: 1.5rem; color: rgba(255, 255, 255, 0.8);">
                Connect your TON wallet to receive prize payouts automatically
            </p>
            <div class="wallet-input-group">
                <input type="text" id="wallet" value="${wallet}" placeholder="Enter your TON wallet address" />
                <button onclick="saveWallet()">Save Wallet</button>
            </div>
            <div id="wallet-status"></div>
            
            <div style="margin-top: 2rem; padding: 1.5rem; background: rgba(255, 255, 255, 0.05); border-radius: 15px; border-left: 4px solid #ffd700;">
                <h4 style="color: #ffd700; margin-bottom: 0.5rem;">Wallet Tips:</h4>
                <ul style="color: rgba(255, 255, 255, 0.8); line-height: 1.6; padding-left: 1rem;">
                    <li>Use only TON wallet addresses (starting with EQ...)</li>
                    <li>Double-check your address before saving</li>
                    <li>Payouts are processed automatically after competitions end</li>
                    <li>Minimum payout is 0.1 TON</li>
                </ul>
            </div>
        </div>
    `;
}
async function saveWallet() {
    const walletInput = document.getElementById("wallet");
    const wallet = walletInput.value.trim();
    const statusDiv = document.getElementById("wallet-status");

    if (!wallet) {
        statusDiv.textContent = "Please enter a wallet address!";
        statusDiv.className = "wallet-status-error";
        return;
    }

    if (!wallet.startsWith("EQ") && !wallet.startsWith("UQ")) {
        statusDiv.textContent = "Invalid TON wallet format! Address should start with EQ or UQ";
        statusDiv.className = "wallet-status-error";
        return;
    }

    if (wallet.length < 40) {
        statusDiv.textContent = "TON wallet address is too short!";
        statusDiv.className = "wallet-status-error";
        return;
    }

    // достаем юзера из localStorage (ты сохраняешь его в onTelegramAuth)
    const storedUser = JSON.parse(localStorage.getItem("telegramUser"));
    if (!storedUser) {
        showNotification("Please log in with Telegram first", "error");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/save_wallet`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                telegram_id: storedUser.telegram_id,
                wallet: wallet
            }),
        });

        const data = await response.json();
        if (response.ok) {
            // обновим localStorage тоже, чтобы всё было синхронно
            storedUser.wallet = wallet;
            localStorage.setItem("telegramUser", JSON.stringify(storedUser));

            statusDiv.textContent = "✅ Wallet saved successfully!";
            statusDiv.className = "wallet-status-success";
            showNotification("TON wallet connected successfully!", "success");
        } else {
            statusDiv.textContent = "❌ Failed to save wallet";
            statusDiv.className = "wallet-status-error";
        }
    } catch (err) {
        console.error(err);
        statusDiv.textContent = "❌ Network error";
        statusDiv.className = "wallet-status-error";
    }
}

/*/ Save wallet
function saveWallet() {
    const walletInput = document.getElementById("wallet");
    const wallet = walletInput.value.trim();
    const statusDiv = document.getElementById("wallet-status");
    
    if (!wallet) {
        statusDiv.textContent = "Please enter a wallet address!";
        statusDiv.className = "wallet-status-error";
        return;
    }
    
    // Basic TON wallet validation
    if (!wallet.startsWith("EQ") && !wallet.startsWith("UQ")) {
        statusDiv.textContent = "Invalid TON wallet format! Address should start with EQ or UQ";
        statusDiv.className = "wallet-status-error";
        return;
    }
    
    if (wallet.length < 40) {
        statusDiv.textContent = "TON wallet address is too short!";
        statusDiv.className = "wallet-status-error";
        return;
    }
    
    localStorage.setItem("userWallet", wallet);
    statusDiv.textContent = "вњ… Wallet saved successfully! You're ready to receive payouts.";
    statusDiv.className = "wallet-status-success";
    
    // Show success notification
    showNotification("TON wallet connected successfully!", 'success');
}*/

// Logout
function logout() {
    if (confirm("Are you sure you want to log out?")) {
        localStorage.removeItem("telegramUser");
        localStorage.removeItem("userWallet");
        showNotification("Logged out successfully!", 'info');
        setTimeout(() => {
            location.reload(); // refresh page to show login button again
        }, 1000);
    }
}

// ===== NEW MOBILE FUNCTIONALITY =====

// Mobile Menu Toggle Functionality
function initMobileMenu() {
    // Add mobile menu toggle to nav
    const nav = document.querySelector('nav');
    const navLinks = document.querySelector('.nav-links');
    
    // Create mobile menu toggle button
    const mobileToggle = document.createElement('div');
    mobileToggle.className = 'mobile-menu-toggle';
    mobileToggle.innerHTML = `
        <span></span>
        <span></span>
        <span></span>
    `;
    
    // Insert mobile toggle before nav-links
    nav.insertBefore(mobileToggle, navLinks);
    
    // Toggle mobile menu
    mobileToggle.addEventListener('click', function() {
        this.classList.toggle('active');
        navLinks.classList.toggle('mobile-open');
    });
    
    // Close mobile menu when clicking on links
    const navLinksItems = navLinks.querySelectorAll('a');
    navLinksItems.forEach(link => {
        link.addEventListener('click', () => {
            mobileToggle.classList.remove('active');
            navLinks.classList.remove('mobile-open');
        });
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!nav.contains(e.target)) {
            mobileToggle.classList.remove('active');
            navLinks.classList.remove('mobile-open');
        }
    });
}

// Optimize for touch devices
function optimizeForTouch() {
    // Add touch-friendly hover effects
    const cards = document.querySelectorAll('.game-card, .competition-card');
    cards.forEach(card => {
        card.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.98)';
        });
        
        card.addEventListener('touchend', function() {
            this.style.transform = 'scale(1)';
        });
    });
    
    // Prevent zoom on input focus for mobile
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            if (window.innerWidth < 768) {
                const viewport = document.querySelector('meta[name=viewport]');
                viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0');
            }
        });
        
        input.addEventListener('blur', function() {
            if (window.innerWidth < 768) {
                const viewport = document.querySelector('meta[name=viewport]');
                viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
            }
        });
    });
}

// Проверка при загрузке страницы
function checkSession() {
  const storedUser = localStorage.getItem("telegramUser");
  if (storedUser) {
    const user = JSON.parse(storedUser);
    console.log("Restored user:", user);
    renderUserProfile(user);
  } else {
    console.log("Нет сохранённого пользователя");
  }
}
     
// Enhanced DOMContentLoaded with mobile support
document.addEventListener('DOMContentLoaded', function() {
    
    // Initialize mobile menu
    initMobileMenu();
    
    // Optimize for touch devices
    optimizeForTouch();

    // Check session on load
    checkSession();
    
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

    // Check for stored user
    const storedUser = localStorage.getItem("telegramUser");
    if (storedUser) {
        const user = JSON.parse(storedUser);
        renderUserProfile(user);
    }
});

// Handle orientation changes
window.addEventListener('orientationchange', function() {
    setTimeout(() => {
        window.scrollTo(0, 0);
    }, 100);
});

// Handle window resize
window.addEventListener('resize', function() {
    // Close mobile menu on resize
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileToggle && navLinks) {
        if (window.innerWidth > 768) {
            mobileToggle.classList.remove('active');
            navLinks.classList.remove('mobile-open');
        }
    }
});




