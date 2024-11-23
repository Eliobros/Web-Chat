// Configuração do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getAuth, onAuthStateChanged, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
import { getFirestore, collection, addDoc, doc, getDocs, setDoc } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";

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

// Configurar a persistência da sessão
setPersistence(auth, browserLocalPersistence)
    .then(() => {
        console.log('Sessão mantida no navegador.');
    })
    .catch((error) => {
        console.error('Erro ao manter a sessão:', error);
    });

// Variáveis globais
const API_KEY = 'app-hWyXMuzlYLsodBKfZH5BhXR6'; // Chave da API Dify
const DIFY_API_URL = 'https://api.dify.ai/v1/chat-messages';
const sendButton = document.getElementById('sendButton');
const messageInput = document.getElementById('message-input');
const chatBox = document.getElementById('chat-box');

// Função para verificar se o usuário está logado
onAuthStateChanged(auth, (user) => {
    if (!user) {
        console.log("Usuário não autenticado. Redirecionando...");
        alert("UID não encontrado, por favor faça login.");
        window.location.href = 'index.html'; // Redireciona para login
    } else {
        console.log("Usuário autenticado:", user);
        carregarMensagens(); // Carregar mensagens quando o usuário estiver logado
    }
});

// Função para salvar a mensagem no Firestore
async function salvarMensagem(sender, messageText, time) {
    const user = auth.currentUser;
    if (user) {
        const userId = user.uid;

        // Cria a coleção se não existir
        const messagesRef = doc(db, 'messages', userId);
        const userRef = doc(db, 'users', userId);

        await setDoc(messagesRef, {}, { merge: true });
        await setDoc(userRef, { userId: userId }, { merge: true });

        // Adiciona a nova mensagem
        await addDoc(collection(messagesRef, 'chat'), {
            sender,
            message: messageText,
            time,
        });
    }
}

// Função para carregar as mensagens do Firestore
async function carregarMensagens() {
    const user = auth.currentUser;
    if (user) {
        const userId = user.uid;
        const messagesSnapshot = await getDocs(collection(doc(db, 'messages', userId), 'chat'));

        // Verifica se existem mensagens
        if (messagesSnapshot.empty) {
            console.log("Sem mensagens para este usuário.");
            appendMessage('system', 'Nenhuma mensagem encontrada. Seja o primeiro a enviar uma mensagem!', 'Agora');
        } else {
            messagesSnapshot.forEach(doc => {
                const message = doc.data();
                appendMessage(message.sender, message.message, message.time);
            });
        }
    } else {
        console.log("Nenhum usuário autenticado.");
    }
}

// Função para enviar mensagem ao clicar no botão ou pressionando Enter
sendButton.addEventListener('click', async () => {
    const userMessage = messageInput.value.trim();
    if (userMessage) {
        const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        appendMessage('user', userMessage, currentTime);
        salvarMensagem('user', userMessage, currentTime);

        messageInput.value = ''; // Limpa o campo de entrada

        const response = await sendMessageToAPI(userMessage);

        if (response) {
            const botMessage = response.answer || 'Desculpe, não consegui entender sua pergunta.';
            appendMessage('bot', botMessage, currentTime);
            salvarMensagem('bot', botMessage, currentTime);
        } else {
            appendMessage('bot', 'Ocorreu um erro ao processar sua solicitação. Tente novamente mais tarde.', currentTime);
            salvarMensagem('bot', 'Ocorreu um erro ao processar sua solicitação. Tente novamente mais tarde.', currentTime);
        }
    }
});

// Função para enviar mensagem para a API
async function sendMessageToAPI(userMessage) {
    try {
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
            headers: headers,
            body: JSON.stringify(data)
        });

        if (response.ok) {
            const responseData = await response.json();
            return responseData;
        } else {
            console.error('Erro na resposta da API');
            return null;
        }
    } catch (error) {
        console.error('Erro ao chamar a API:', error);
        return null;
    }
}

// Função para exibir mensagens no chat
function appendMessage(sender, messageText, time) {
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
    scrollToBottom();
}

// Função para rolar o chat até o final
function scrollToBottom() {
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Função para enviar mensagem ao pressionar Enter
messageInput.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
        sendButton.click();
    }
});
