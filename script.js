// ===== CONFIG =====
const API_URL = "https://backend-51rt.onrender.com";

// ===== SECTION NAVIGATION =====
function showSection(sectionName) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(sectionName).classList.add('active');

    document.querySelectorAll('.nav-links a').forEach(link => link.style.color = '#fff');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (Math.random() < 0.3) showInterstitialAd();
}

// ===== GAMES =====
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
    if (!gameUrl) return showNotification("Game coming soon!", 'info');

    if (screen.orientation && screen.orientation.lock) {
        try { screen.orientation.lock('portrait').catch(() => {}); } catch(e){}
    }

    document.getElementById("game-frame").src = gameUrl;
    document.getElementById("game-modal").style.display = "flex";

    setTimeout(() => {
        if (confirm("Watch a short ad to double your potential winnings?")) {
            showNotification("🎯 Winnings multiplier activated!", 'success');
        }
    }, 3000);
}

function closeGame() {
    document.getElementById("game-frame").src = "";
    document.getElementById("game-modal").style.display = "none";

    if (screen.orientation && screen.orientation.unlock) {
        try { screen.orientation.unlock(); } catch(e) {}
    }

    setTimeout(() => showNotification("Great game! Check today's competitions!", 'info'), 500);
}

// ===== NOTIFICATIONS =====
function showNotification(message, type='info') {
    const notification = document.createElement('div');
    const isMobile = window.innerWidth <= 768;
    notification.style.cssText = `
        position: fixed;
        ${isMobile ? 'top:80px; left:10px; right:10px; width:auto;' : 'top:20px; right:20px; max-width:300px;'}
        padding:1rem 2rem; border-radius:10px; z-index:10000; animation:slideIn 0.3s ease;
        word-wrap:break-word; box-shadow:0 10px 30px rgba(0,0,0,0.3); backdrop-filter:blur(10px);
    `;
    switch(type) {
        case 'success': notification.style.background='linear-gradient(45deg,#4ecdc4,#45b7d1)'; break;
        case 'error': notification.style.background='linear-gradient(45deg,#ff6b6b,#ff5722)'; break;
        case 'info': notification.style.background='linear-gradient(45deg,#667eea,#764ba2)'; break;
    }
    notification.style.color='white';
    notification.textContent=message;
    document.body.appendChild(notification);
    setTimeout(()=>notification.remove(),5000);
}

// ===== HEADER SCROLL =====
window.addEventListener('scroll', () => {
    const header = document.querySelector('header');
    header.style.background = window.scrollY > 100 ? 'rgba(0,0,0,0.95)' : 'rgba(0,0,0,0.9)';
});

// ===== GAME SCORE SUBMISSION =====
window.addEventListener('message', async (event) => {
    if(event.data.type === 'gameComplete') {
        const { game, score, data, wallet, timestamp } = event.data;
        if(!validateScore(game,score,data)) return;

        try {
            const resp = await fetch(`${API_URL}/submit-score`, {
                method:'POST',
                headers:{'Content-Type':'application/json'},
                body: JSON.stringify({ wallet, game, score, gameData:data, timestamp }),
                credentials:'include'
            });

            if(resp.ok) showNotification(`Score ${score} saved for ${game}!`, 'success');
            else if(resp.status===401) showTelegramLogin();
        } catch(err) {
            console.error(err);
            showNotification('Failed to save score','error');
        }
    }
});

// ===== TELEGRAM AUTH =====
async function onTelegramAuth(user){
    try{
        showNotification('Authenticating with Telegram...','info');
        const resp = await fetch(`${API_URL}/auth/telegram`, {
            method:'POST', headers:{'Content-Type':'application/json'},
            body:JSON.stringify(user), credentials:'include'
        });
        if(resp.ok){
            const data = await resp.json();
            renderUserProfile(data.user);
            showSection('account');
            showNotification('Successfully authenticated!','success');
        } else showNotification('Authentication failed','error');
    }catch(err){
        console.error(err);
        showNotification('Authentication failed','error');
    }
}

async function verifyAndShowUser() {
    try{
        const resp = await fetch(`${API_URL}/auth/me`, {credentials:'include'});
        if(resp.ok){
            const user = await resp.json();
            renderUserProfile(user);
            return true;
        } else showTelegramLogin();
    } catch(err){
        console.error(err);
        showTelegramLogin();
    }
}

// ===== USER PROFILE =====
function renderUserProfile(user){
    const authContainer = document.getElementById("auth-container");
    authContainer.innerHTML=`
        <div class="user-info">
            ${user.photo_url ? `<img src="${user.photo_url}" style="width:40px;height:40px;border-radius:50%;" />` : ''}
            <span>${user.first_name}</span>
            <button onclick="logout()" class="logout-btn">Logout</button>
        </div>`;
    renderAccountPage(user);
}

function showTelegramLogin(){
    const authContainer = document.getElementById("auth-container");
    authContainer.innerHTML=`
        <script async src="https://telegram.org/js/telegram-widget.js?21"
            data-telegram-login="tongames_test_bot"
            data-size="large"
            data-userpic="true"
            data-onauth="onTelegramAuth(user)"
            data-request-access="write">
        </script>`;
}

// ===== LOGOUT =====
async function logout(){
    try{
        await fetch(`${API_URL}/auth/logout`,{method:'POST',credentials:'include'});
        showTelegramLogin();
        showSection('home');
        showNotification("Вы вышли",'info');
    }catch(err){console.error(err);}
}

// ===== WALLET =====
async function saveWallet() {
    const walletInput = document.getElementById("wallet");
    const wallet = walletInput.value.trim();
    const statusDiv = document.getElementById("wallet-status");
    
    if (!wallet) {
        statusDiv.textContent = "Please enter a wallet address!";
        statusDiv.className = "wallet-status-error";
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/user/wallet`, {
            method: 'PUT',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ wallet }),
            credentials:'include'
        });

        if (response.ok) {
            statusDiv.textContent = "✅ Wallet saved successfully!";
            statusDiv.className = "wallet-status-success";
            showNotification("TON wallet connected successfully!", 'success');
        } else {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to save wallet');
        }
    } catch (error) {
        console.error('Wallet save error:', error);
        statusDiv.textContent = `❌ Error: ${error.message}`;
        statusDiv.className = "wallet-status-error";
        showNotification(`Failed to save wallet: ${error.message}`, 'error');
    }
}

// ===== MOBILE MENU & TOUCH OPTIMIZATIONS =====
// ... Здесь оставляем твои функции initMobileMenu() и optimizeForTouch() без изменений

// ===== DOMContentLoaded =====
document.addEventListener('DOMContentLoaded', function() {
    initMobileMenu();
    optimizeForTouch();
    verifyAndShowUser();

    // Cards animation, ad simulation, orientation, resize - оставляем как есть
});

/*/ Section navigation
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

    // Show interstitial ad when changing sections
    if (Math.random() < 0.3) { // 30% chance
        showInterstitialAd();
    }
}

// Enhanced game functionality with mobile support
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
    
    // Show rewarded ad option with mobile-friendly timing
    setTimeout(() => {
        if (confirm("Watch a short ad to double your potential winnings for this game?")) {
            showNotification("🎯 Winnings multiplier activated! Good luck!", 'success');
        }
    }, 3000); // Longer delay for mobile users
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

// ==== Telegram Authorization ====
const API_URL = "https://backend-51rt.onrender.com"

async function onTelegramAuth(user) {
    //alert(JSON.stringify(user, null, 2));
    try {
        let dbUser;

        // 1. Проверяем, есть ли пользователь в базе
        let response = await fetch(`${API_URL}/user/${user.id}`);
        
        if (response.ok) {
            dbUser = await response.json();
        } else {
            // 2. Если нет — регистрируем
            response = await fetch(`${API_URL}/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    telegram_id: user.id,      // ⚡️ это правильно
                    username: user.username || null,
                    first_name: user.first_name || null,
                    last_name: user.last_name || null,
                    photo_url: user.photo_url || null
                })
            });
            alert(response);

            dbUser = await response.json();

            // Проверим, что вернул API
            console.log("Register API response:", dbUser);

            // Если API возвращает { user: { ... } }, берём dbUser.user
            if (dbUser.user) {
                dbUser = dbUser.user;
            }
        }

        console.log("Final dbUser:", dbUser);

        renderUserProfile(dbUser);
        showSection("account");

    } catch (err) {
        console.error("Auth failed:", err);
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
            <h3>💰 TON Wallet</h3>
            <p style="margin-bottom: 1.5rem; color: rgba(255, 255, 255, 0.8);">
                Connect your TON wallet to receive prize payouts automatically
            </p>
            <div class="wallet-input-group">
                <input type="text" id="wallet" value="${wallet}" placeholder="Enter your TON wallet address" />
                <button onclick="saveWallet()">Save Wallet</button>
            </div>
            <div id="wallet-status"></div>
            
            <div style="margin-top: 2rem; padding: 1.5rem; background: rgba(255, 255, 255, 0.05); border-radius: 15px; border-left: 4px solid #ffd700;">
                <h4 style="color: #ffd700; margin-bottom: 0.5rem;">💡 Wallet Tips:</h4>
                <ul style="color: rgba(255, 255, 255, 0.8); line-height: 1.6; padding-left: 1rem;">
                    <li>Use only TON wallet addresses (starting with EQ...)</li>
                    <li>Double-check your address before saving</li>
                    <li>Payouts are processed automatically after competitions end</li>
                    <li>Minimum payout is 0.1 TON</li>
                </ul>
            </div>
        </div>
    `;
    checkSession();
}

// Save wallet
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
    statusDiv.textContent = "✅ Wallet saved successfully! You're ready to receive payouts.";
    statusDiv.className = "wallet-status-success";
    
    // Show success notification
    showNotification("TON wallet connected successfully!", 'success');
}

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

// Check session on load
async function checkSession() {
    try {
        const response = await fetch(`${API_URL}/auth/check`, { credentials: "include" });
        if (response.ok) {
            const user = await response.json();
            renderUserProfile(user);
            showSection("account");
        } else {
            console.log("No active session");
        }
    } catch (err) {
        console.error("Session check failed:", err);
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

    // Simulate ad revenue tracking
    setTimeout(() => {
        console.log('Ad impressions: 12, RPM: $3.20, Revenue: $0.038');
    }, 5000);
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
});*/


