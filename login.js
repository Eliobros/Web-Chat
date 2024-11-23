import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";

// Importando os módulos do Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getFirestore, collection, query, where, getDocs, addDoc } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';

// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyD8sFMFCg86BiIJStzZAI-tbkuqdit-_bw",
    authDomain: "chat-tina017-fd9e4.firebaseapp.com",
    projectId: "chat-tina017-fd9e4",
    storageBucket: "chat-tina017-fd9e4.appspot.com", // Corrigido
    messagingSenderId: "221363585172",
    appId: "1:221363585172:web:fe1aac21b6302113feb481",
    measurementId: "G-H5FKYVC3PS"
};

// Inicializando o Firebase
const app = initializeApp(firebaseConfig); 
const db = getFirestore(app);
const auth = getAuth(app);

// Função de Login com e-mail e senha
document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", email));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            alert("Usuário não encontrado.");
        } else {
            querySnapshot.forEach((doc) => {
                console.log("Usuário encontrado:", doc.data());
                window.location.href = "chat.html"; // Redireciona para o chat
            });
        }
    } catch (error) {
        console.error("Erro ao fazer login:", error);
        alert('Erro ao fazer login. Verifique seu email e senha.');
    }
});

// Função de Registro com e-mail e senha
document.getElementById("registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById('usernameReg').value; // Novo campo
    const email = document.getElementById('emailReg').value;
    const password = document.getElementById('passwordReg').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        alert("As senhas não coincidem!");
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Adicionando o usuário ao Firestore
        await addDoc(collection(db, "users"), {
            username: username, // Incluído
            email: email,
            password: password
        });

        alert("Usuário registrado com sucesso!");
        window.location.href = "chat.html"; // Redireciona para o chat após registro
    } catch (error) {
        console.error("Erro ao criar conta:", error);
        alert('Erro ao criar conta.');
    }
});

// Função de Login com Google
document.getElementById("googleBtnLogin").addEventListener("click", async (e) => {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", user.email));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            alert("Usuário não encontrado no Firestore. Criando usuário...");
            // Adiciona o usuário ao Firestore
            await addDoc(collection(db, "users"), {
                username: user.displayName, // Nome do usuário do Google
                email: user.email
            });
        } else {
            querySnapshot.forEach((doc) => {
                console.log("Usuário encontrado:", doc.data());
            });
        }

        // Redireciona para o chat após login
        window.location.href = "chat.html";
    } catch (error) {
        console.error("Erro ao fazer login com Google:", error);
        alert("Erro ao fazer login com Google.");
    }
});

// Função de Cadastro com Google
document.getElementById("googleBtnRegister").addEventListener("click", async (e) => {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        // Adicionando o usuário ao Firestore (caso ainda não exista)
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", user.email));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            await addDoc(collection(db, "users"), {
                username: user.displayName, // Nome do usuário do Google
                email: user.email
            });

            alert("Usuário registrado com sucesso com Google!");
            window.location.href = "chat.html"; // Redireciona para o chat após registro
        } else {
            alert("Usuário já cadastrado com esse e-mail!");
        }
    } catch (error) {
        console.error("Erro ao criar conta com Google:", error);
        alert("Erro ao criar conta com Google.");
    }
});

// Função para solicitar o e-mail ao usuário e enviar o link de redefinição de senha
function forgotPassword() {
    const email = window.prompt("Digite seu e-mail para redefinir a senha:");

    if (email) {
        const auth = getAuth();
        sendPasswordResetEmail(auth, email)
            .then(() => {
                alert("Um link para redefinir sua senha foi enviado para o seu e-mail.");
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                console.error('Erro ao enviar o link:', errorMessage);
                alert("Houve um erro ao tentar enviar o e-mail de redefinição. Verifique o e-mail e tente novamente.");
            });
    } else {
        alert("Por favor, insira um e-mail válido.");
    }
  }
