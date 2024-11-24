// Configuração do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { 
    getAuth, 
    onAuthStateChanged, 
    setPersistence, 
    browserLocalPersistence, 
    signInWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    doc, 
    getDocs, 
    setDoc, 
    addDoc 
} from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";

// Inicializar Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBxml_34BiDbOmMxclzM-UnFzke9ymcf8A",
    authDomain: "tina-chat-87cc1.firebaseapp.com",
    projectId: "tina-chat-87cc1",
    storageBucket: "tina-chat-87cc1.firebasestorage.app",
    messagingSenderId: "518858413060",
    appId: "1:518858413060:web:86c6cb8f5094a9b5291151",
    measurementId: "G-CB39SE8MQZ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Configura persistência da sessão
setPersistence(auth, browserLocalPersistence)
    .then(() => console.log("Persistência configurada."))
    .catch((error) => console.error("Erro ao configurar persistência:", error));

// Função para pegar o UID da URL
function getUIDFromURL() {
    const params = new URLSearchParams(window.location.search);
    const uid = params.get('uid');
    console.log("UID recuperado da URL:", uid);
    return uid;
}

// Validação de autenticação na página do chat
onAuthStateChanged(auth, (user) => {
    const uidFromURL = getUIDFromURL();

    if (user && user.uid === uidFromURL) {
        console.log("Usuário autenticado:", user.uid);
        carregarMensagens();
    } else {
        console.error("Usuário não autenticado ou UID inválido.");
        alert("Por favor, faça login.");
        window.location.href = "index.html";
    }
});

// Função para carregar mensagens do Firestore
async function carregarMensagens() {
    const user = auth.currentUser;

    if (user) {
        const userId = user.uid;
        console.log("Carregando mensagens para o usuário:", userId);

        try {
            const messagesSnapshot = await getDocs(collection(doc(db, 'messages', userId), 'chat'));

            if (messagesSnapshot.empty) {
                console.log("Sem mensagens para este usuário.");
                appendMessage('system', 'Nenhuma mensagem encontrada. Envie a primeira mensagem!', 'Agora');
            } else {
                messagesSnapshot.forEach(doc => {
                    const message = doc.data();
                    appendMessage(message.sender, message.message, message.time);
                });
            }
        } catch (error) {
            console.error("Erro ao carregar mensagens:", error);
        }
    } else {
        console.error("Usuário não autenticado.");
    }
}

// Função para salvar mensagem no Firestore
async function salvarMensagem(sender, messageText, time) {
    const user = auth.currentUser;

    if (user) {
        const userId = user.uid;

        try {
            const messagesRef = doc(db, 'messages', userId);

            await setDoc(messagesRef, {}, { merge: true });
            await addDoc(collection(messagesRef, 'chat'), {
                sender,
                message: messageText,
                time,
            });
        } catch (error) {
            console.error("Erro ao salvar mensagem:", error);
        }
    }
}

// Função para enviar mensagem
async function sendMessage(userMessage) {
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    appendMessage('user', userMessage, currentTime);
    salvarMensagem('user', userMessage, currentTime);

    try {
        const response = await sendMessageToAPI(userMessage);
        const botMessage = response.answer || "Desculpe, não consegui entender sua pergunta.";
        appendMessage('bot', botMessage, currentTime);
        salvarMensagem('bot', botMessage, currentTime);
    } catch (error) {
        console.error("Erro ao processar mensagem:", error);
        appendMessage('bot', "Erro ao processar sua solicitação. Tente novamente mais tarde.", currentTime);
    }
}

// Função para exibir mensagem no chat
function appendMessage(sender, messageText, time) {
    const chatBox = document.getElementById('chat-box');
    const messageContainer = document.createElement('div');
    messageContainer.classList.add('message', sender);

    const messageBubble = document.createElement('div');
    messageBubble.classList.add('message-bubble');
    messageBubble.textContent = messageText;

    const messageTime = document.createElement('span');
    messageTime.classList.add('message-time');
    messageTime.textContent = time;

    messageBubble.appendChild(messageTime);
    messageContainer.appendChild(messageBubble);

    chatBox.appendChild(messageContainer);
    chatBox.scrollTop = chatBox.scrollHeight; // Rola para o final do chat
}

// Enviar mensagem ao pressionar Enter ou clicar no botão
document.getElementById('sendButton').addEventListener('click', () => {
    const messageInput = document.getElementById('message-input');
    const userMessage = messageInput.value.trim();

    if (userMessage) {
        sendMessage(userMessage);
        messageInput.value = ''; // Limpa o campo de entrada
    }
});

document.getElementById('message-input').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        document.getElementById('sendButton').click();
    }
});

// Função para enviar mensagem para a API
async function sendMessageToAPI(userMessage) {
    const API_KEY = "app-hWyXMuzlYLsodBKfZH5BhXR6"; // Substitua pela chave da sua API
    const DIFY_API_URL = "https://api.dify.ai/v1/chat-messages";

    const data = {
        query: userMessage,
        inputs: {},
        response_mode: "blocking",
        user: "12345",
        conversation_id: "",
        files: []
    };

    const headers = {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
    };

    const response = await fetch(DIFY_API_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
    });

    if (response.ok) {
        return response.json();
    } else {
        throw new Error("Erro na API");
    }
}
