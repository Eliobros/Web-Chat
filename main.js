// Configuração do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getAuth, onAuthStateChanged, setPersistence, browserLocalPersistence, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
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

// Configurar persistência
setPersistence(auth, browserLocalPersistence)
    .then(() => {
        console.log("Persistência configurada com sucesso.");
        // Aguardar o estado de autenticação
        checkAuthState();
    })
    .catch((error) => {
        console.error("Erro ao configurar persistência:", error);
    });

// Função para verificar o estado de autenticação
function checkAuthState() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            const uidFromURL = getUIDFromURL();
            console.log("Usuário autenticado:", user.uid);
            console.log("UID da URL:", uidFromURL);

            if (user.uid === uidFromURL) {
                console.log("UID corresponde, carregando mensagens...");
                carregarMensagens();
            } else {
                console.error("UID da URL não corresponde ao UID autenticado.");
                alert("UID inválido. Faça login novamente.");
                window.location.href = "index.html";
            }
        } else {
            console.error("Usuário não autenticado. Faça login novamente.");
            alert("Por favor, faça login.");
            window.location.href = "index.html";
        }
    });
}

// Função para recuperar o UID da URL
function getUIDFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('uid');
}

// Função para salvar mensagens no Firestore
async function salvarMensagem(sender, messageText, time) {
    const user = auth.currentUser;
    if (user) {
        const userId = user.uid;

        const messagesRef = doc(db, 'messages', userId);
        const userRef = doc(db, 'users', userId);

        await setDoc(messagesRef, {}, { merge: true });
        await setDoc(userRef, { userId: userId }, { merge: true });

        await addDoc(collection(messagesRef, 'chat'), {
            sender,
            message: messageText,
            time,
        });
    } else {
        console.error("Nenhum usuário autenticado. Não foi possível salvar a mensagem.");
    }
}

// Função para carregar mensagens do Firestore
async function carregarMensagens() {
    const user = auth.currentUser;
    if (user) {
        const userId = user.uid;
        console.log("Carregando mensagens para o UID:", userId);

        const messagesSnapshot = await getDocs(collection(doc(db, 'messages', userId), 'chat'));

        if (messagesSnapshot.empty) {
            console.log("Nenhuma mensagem encontrada para este usuário.");
            appendMessage('system', 'Nenhuma mensagem encontrada. Seja o primeiro a enviar!', 'Agora');
        } else {
            messagesSnapshot.forEach(doc => {
                const message = doc.data();
                appendMessage(message.sender, message.message, message.time);
            });
        }
    } else {
        console.error("Nenhum usuário autenticado ao tentar carregar mensagens.");
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

// Função para enviar mensagens
sendButton.addEventListener('click', async () => {
    const userMessage = messageInput.value.trim();
    if (userMessage) {
        const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        appendMessage('user', userMessage, currentTime);
        salvarMensagem('user', userMessage, currentTime);

        messageInput.value = '';

        const response = await sendMessageToAPI(userMessage);

        if (response) {
            const botMessage = response.answer || 'Desculpe, não consegui entender sua pergunta.';
            appendMessage('bot', botMessage, currentTime);
            salvarMensagem('bot', botMessage, currentTime);
        } else {
            appendMessage('bot', 'Erro ao processar sua solicitação. Tente novamente.', currentTime);
            salvarMensagem('bot', 'Erro ao processar sua solicitação. Tente novamente.', currentTime);
        }
    }
});

// Função para enviar mensagem à API
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

// Função para rolar o chat até o final
function scrollToBottom() {
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Função para enviar ao pressionar Enter
messageInput.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
        sendButton.click();
    }
});
