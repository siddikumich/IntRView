import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar'; 
import ProblemInput from './components/ProblemInput';
import Chat from './components/Chat';
import { callGeminiAPI, generateInitialPrompt } from './services/api';
import { auth, db } from './firebase';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, getDocs, doc, updateDoc, query, orderBy, serverTimestamp } from "firebase/firestore";

function App() {
  // Existing State
  const [user, setUser] = useState(null);
  const [problem, setProblem] = useState('');
  const [code, setCode] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // State for managing chat history and active chat
  const [savedChats, setSavedChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // --- Authentication and Data Fetching ---

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        getChatsForUser(currentUser.uid);
      } else {
        setSavedChats([]); // Clear chats on logout
        handleNewChat(); // Reset the view to a clean state
        setIsInitialLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const getChatsForUser = async (userId) => {
    setIsInitialLoading(true);
    try {
      const chatsCollectionRef = collection(db, "users", userId, "chats");
      const q = query(chatsCollectionRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const userChats = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSavedChats(userChats);
    } catch (error) {
      console.error("Could not fetch user chats.", error);
      setError("Failed to load chat history.");
    } finally {
      setIsInitialLoading(false);
    }
  };

  // --- FIXED AUTH FUNCTIONS ---
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google: ", error);
      setError("Failed to sign in with Google.");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out: ", error);
      setError("Failed to sign out.");
    }
  };

  // --- Chat Management Logic ---

  const handleNewChat = () => {
    setActiveChatId(null);
    setProblem('');
    setCode('');
    setMessages([]);
    setError(null);
  };

  const handleSelectChat = (chatId) => {
    const selectedChat = savedChats.find(chat => chat.id === chatId);
    if (selectedChat) {
      setActiveChatId(selectedChat.id);
      setProblem(selectedChat.problem || '');
      setCode(selectedChat.code || '');
      setMessages(selectedChat.messages || []);
      setError(null);
    }
  };

  // --- Core Interview Logic ---

  const handleStartInterview = async () => {
    if (!problem.trim() || !code.trim() || !user) return;
    
    setError(null);
    setIsLoading(true);
    setMessages([]);

    const initialPrompt = generateInitialPrompt(problem, code);
    const initialHistory = [{ role: 'user', parts: [{ text: initialPrompt }] }];
    
    try {
      const response = await callGeminiAPI(initialHistory);
      const firstBotMessage = { role: 'model', text: response };
      
      const chatData = {
        problem,
        code,
        messages: [firstBotMessage],
        createdAt: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, "users", user.uid, "chats"), chatData);
      
      setActiveChatId(docRef.id);
      setMessages([firstBotMessage]);
      // Use a functional update to ensure we have the latest state
      setSavedChats(prevChats => [{ id: docRef.id, ...chatData }, ...prevChats]);

    } catch (error) {
      setError(`Error starting interview: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (userInput) => {
    if (!user || !activeChatId) {
        if(!activeChatId && problem && code) return handleStartInterview();
        return;
    }

    const newUserMessage = { role: 'user', text: userInput };
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setIsLoading(true);
    setError(null);

    const historyForApi = updatedMessages.map(msg => ({
      role: msg.role === 'model' ? 'model' : 'user', // Correctly map roles
      parts: [{ text: msg.text }]
    }));

    try {
      const response = await callGeminiAPI(historyForApi);
      const newBotMessage = { role: 'model', text: response };
      const finalMessages = [...updatedMessages, newBotMessage];
      setMessages(finalMessages);

      const chatDocRef = doc(db, "users", user.uid, "chats", activeChatId);
      await updateDoc(chatDocRef, {
        messages: finalMessages
      });

    } catch (error) {
      setError(`Error fetching response: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="flex h-screen bg-gray-900 text-white font-sans relative">
      <Navbar user={user} signInWithGoogle={signInWithGoogle} signOut={handleSignOut} />
      
      {user ? (
        <div className="flex w-full h-full pt-16"> {/* Add padding top to avoid navbar overlap */}
          <Sidebar 
            savedChats={savedChats}
            onSelectChat={handleSelectChat}
            onNewChat={handleNewChat}
            activeChatId={activeChatId}
          />
          <div className="flex flex-1">
            <ProblemInput
              problem={problem}
              setProblem={setProblem}
              code={code}
              setCode={setCode}
              onStartInterview={handleStartInterview}
              interviewStarted={messages.length > 0} 
              error={error}
            />
            <Chat
              messages={messages}
              isLoading={isLoading}
              onSendMessage={handleSendMessage}
              interviewStarted={messages.length > 0} 
            />
          </div>
        </div>
      ) : (
        <div className="w-full flex flex-col items-center justify-center">
            {isInitialLoading ? (
                <p>Loading...</p>
            ) : (
                <>
                    <h1 className="text-4xl font-bold text-cyan-400 mb-4">Welcome to the AI Interviewer</h1>
                    <p className="text-gray-400 mb-8">Please sign in to continue.</p>
                    <button onClick={signInWithGoogle} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg">
                        Sign in with Google
                    </button>
                </>
            )}
        </div>
      )}
    </div>
  );
}

export default App;
