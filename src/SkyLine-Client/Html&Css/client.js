const firebaseConfig = {
    apiKey: "YOUR_FIREBASE_API_KEY", // put your stuff here
    authDomain: "YOUR_PROJECT_://firebaseapp.com", // put your stuff here
    projectId: "YOUR_PROJECT_ID", // put your stuff here
    storageBucket: "YOUR_PROJECT_://appspot.com", // put your stuff here
    messagingSenderId: "YOUR_SENDER_ID", // put your stuff here
    appId: "YOUR_APP_ID" // put your stuff here
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Application Variables
let myUsername = ""; 
let currentRoom = "public"; 
let unsubscribe = null;    

// DOM Elements
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const authUserInp = document.getElementById('auth-username');
const authPassInp = document.getElementById('auth-password');
const authError = document.getElementById('auth-error');
const currentUserTag = document.getElementById('current-user-tag');

const messagesContainer = document.getElementById('chat-messages');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const chatTitle = document.getElementById('chat-title');

const friendSearch = document.getElementById('friend-search');
const searchGoBtn = document.getElementById('search-go-btn');
const dynamicDmList = document.getElementById('dynamic-dm-list');

// --- 1. SIGNUP & LOGIN FLOWS ---

// Sign Up Handler
document.getElementById('signup-btn').addEventListener('click', async () => {
    const user = authUserInp.value.trim();
    const pass = authPassInp.value.trim();
    authError.innerText = "";

    if(user.length < 3 || pass.length < 4) {
        authError.innerText = "Username must be 3+ chars, password 4+ chars.";
        return;
    }
    
    // Prevent registering with reserved owner system tags
    if(user.toLowerCase() === "v3mped" || user.toLowerCase() === "gl1tched2") {
        authError.innerText = "That username is reserved by system administrators.";
        return;
    }

    try {
        const userRef = db.collection('users').doc(user.toLowerCase());
        const doc = await userRef.get();

        if (doc.exists) {
            authError.innerText = "Username already taken!";
            return;
        }

        // Save new user profile credentials
        await userRef.set({ username: user, password: pass });
        
        // Log in user and generate the automatic owner responses
        loginSuccess(user);
        await setupAutomaticWelcomeMessages(user);

    } catch (err) {
        authError.innerText = "Registration error: " + err.message;
    }
});

// Login Handler
document.getElementById('login-btn').addEventListener('click', async () => {
    const user = authUserInp.value.trim().toLowerCase();
    const pass = authPassInp.value.trim();
    authError.innerText = "";

    // Bypass check to claim administrator rights for owners on CodeHS
    if((user === "v3mped" && pass === "v3mped123") || (user === "gl1tched2" && pass === "gl1tched123")) {
         loginSuccess(user === "v3mped" ? "V3MPED" : "Gl1TCHED2");
         return;
    }

    try {
        const doc = await db.collection('users').doc(user).get();
        if (!doc.exists || doc.data().password !== pass) {
            authError.innerText = "Invalid username or password credentials.";
            return;
        }
        loginSuccess(doc.data().username);
    } catch (err) {
        authError.innerText = "Login error: " + err.message;
    }
});

function loginSuccess(username) {
    myUsername = username;
    currentUserTag.innerText = `@${myUsername}`;
    authContainer.classList.add('hidden');
    appContainer.classList.remove('hidden');
    switchRoom("public");
}

// --- 2. AUTOMATIC WELCOME ENGINE ---
async function setupAutomaticWelcomeMessages(newUser) {
    const v3mpedRoom = [newUser, "V3MPED"].sort().join("_vs_");
    const gl1tchedRoom = [newUser, "Gl1TCHED2"].sort().join("_vs_");

    // Message 1: From V3MPED
    await db.collection('messages').add({
        text: "Hi I am V3MPED the creator of skyline chat have fun be respectful -V3MPED",
        user: "V3MPED",
        room: v3mpedRoom,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });

    // Message 2: From Gl1TCHED2
    await db.collection('messages').add({
        text: "Hi im Gl1TCHED2 the Co-owner of skyline chat if you have any question Dm V3mped not me i will most likeley not be able to awnser your question",
        user: "Gl1TCHED2",
        room: gl1tchedRoom,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
}

// --- 3. SEARCH BAR ENGINE ---
searchGoBtn.addEventListener('click', findFriend);
friendSearch.addEventListener('keypress', (e) => { if (e.key === 'Enter') findFriend(); });

async function findFriend() {
    const target = friendSearch.value.trim();
    if (!target || target === myUsername) return;

    try {
        const doc = await db.collection('users').doc(target.toLowerCase()).get();
        if (!doc.exists && target !== "V3MPED" && target !== "Gl1TCHED2") {
            alert("User not found inside the Skyline database!");
            return;
        }
        
        // Add user card option dynamically to sidebar UI context
        startDM(doc.exists ? doc.data().username : target);
        friendSearch.value = "";
    } catch(err) {
        console.error("Search error:", err);
    }
}

// --- 4. CHAT LOUNGE LOGIC ---
function switchRoom(roomName) {
    currentRoom = roomName;
    if (unsubscribe) unsubscribe();

    // Toggle active sidebar highlight styles
    document.querySelectorAll('.conv-card').forEach(card => card.classList.remove('active'));
    if (roomName === "public") {
        document.getElementById('card-public').classList.add('active');
        chatTitle.innerText = `🌆 Skyline Chat (Public Room)`;
    } else {
        const targetUser = roomName.replace(myUsername, "").replace("_vs_", "");
        chatTitle.innerText = `Private DM with ${targetUser}`;
        
        // Highlights card if matching user
        if(targetUser === "V3MPED") document.getElementById('card-v3mped').classList.add('active');
        else if(targetUser === "Gl1TCHED2") document.getElementById('card-gl1tched2').classList.add('active');
    }

    unsubscribe = db.collection('messages')
        .where('room', '==', currentRoom)
        .orderBy('timestamp', 'asc')
        .onSnapshot((snapshot) => {
            messagesContainer.innerHTML = ''; 
            snapshot.forEach((doc) => {
                const data = doc.data();
                renderMessage(data.text, data.user, data.user === myUsername);
            });
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        });
}

window.startDM = function(targetUser) {
    if (targetUser === myUsername) return;
    
    const roomId = [myUsername, targetUser].sort().join("_vs_");
    
    // If searching custom users, render a persistent DM link element 
    if(targetUser !== "V3MPED" && targetUser !== "Gl1TCHED2" && !document.getElementById(`card-custom-${targetUser}`)) {
        const rawHtml = `
            <div class="conv-card" id="card-custom-${targetUser}" onclick="startDM('${targetUser}')">
                <h4>💬 ${targetUser}</h4>
            </div>`;
        dynamicDmList.insertAdjacentHTML('beforeend', rawHtml);
    }
    
    switchRoom(roomId);
};

function renderMessage(text, user, isMe) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message');
    if (isMe) msgDiv.classList.add('my-message');

    if (!isMe) {
        msgDiv.innerHTML = `<strong class="clickable-user" onclick="startDM('${user}')">${user}</strong> ${text}`;
    } else {
        msgDiv.innerHTML = `<strong>You</strong> ${text}`;
    }
    messagesContainer.appendChild(msgDiv);
}

async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text) return;

    try {
        await db.collection('messages').add({
            text: text,
            user: myUsername,
            room: currentRoom,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        messageInput.value = ''; 
    } catch (err) {
        console.error("Error output: ", err);
    }
}

sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });
