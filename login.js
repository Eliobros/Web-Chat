// Importando os módulos do Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getFirestore, collection, query, where, getDocs, addDoc } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    GoogleAuthProvider, 
    signInWithPopup, 
    sendEmailVerification 
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';

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

        // Verifica se o e-mail foi verificado
        if (!user.emailVerified) {
            alert("E-mail não verificado. Por favor, verifique sua conta antes de fazer login.");
            return;
        }

        const uid = user.uid; // Recupera o UID do usuário autenticado

        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", email));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            alert("Usuário não encontrado.");
        } else {
            querySnapshot.forEach((doc) => {
                console.log("Usuário encontrado:", doc.data());

                // Redireciona para o chat com o UID na URL
                window.location.href = `chat.html?uid=${uid}`;
            });
        }
    } catch (error) {
        console.error("Erro ao fazer login:", error);
        alert('Erro ao fazer login. Verifique seu e-mail e senha.');
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

        // Enviando e-mail de verificação
        await sendEmailVerification(user);
        alert("E-mail de verificação enviado. Verifique sua caixa de entrada.");

        // Adicionando o usuário ao Firestore
        await addDoc(collection(db, "users"), {
            username: username,
            email: email,
            password: password
        });

        const uid = user.uid; // Recupera o UID do usuário registrado

        alert("Usuário registrado com sucesso!");
        window.location.href = `chat.html?uid=${uid}`; // Redireciona para o chat após registro
    } catch (error) {
        console.error("Erro ao criar conta:", error);
        alert('Erro ao criar conta. Tente novamente mais tarde.');
    }
});

// Função de Login com Google
document.getElementById("googleBtnLogin").addEventListener("click", async (e) => {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        if (!user.emailVerified) {
            alert("E-mail não verificado. Verifique sua conta do Google antes de continuar.");
            return;
        }

        const uid = user.uid; // Recupera o UID do usuário autenticado

        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", user.email));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            alert("Usuário não encontrado no Firestore. Criando usuário...");
            await addDoc(collection(db, "users"), {
                username: user.displayName,
                email: user.email
            });
        }

        // Redireciona para o chat com o UID na URL
        window.location.href = `chat.html?uid=${uid}`;
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

        if (!user.emailVerified) {
            alert("E-mail não verificado. Por favor, verifique seu e-mail do Google.");
            return;
        }

        const uid = user.uid; // Recupera o UID do usuário autenticado

        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", user.email));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            await addDoc(collection(db, "users"), {
                username: user.displayName,
                email: user.email
            });

            alert("Usuário registrado com sucesso com Google!");
        }

        // Redireciona para o chat com o UID na URL
        window.location.href = `chat.html?uid=${uid}`;
    } catch (error) {
        console.error("Erro ao criar conta com Google:", error);
        alert("Erro ao criar conta com Google.");
    }
});
