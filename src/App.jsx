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

  // NEW: State for managing chat history and active chat
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
        setIsInitialLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const getChatsForUser = async (userId) => {
    setIsInitialLoading(true);
    try {
      const chatsCollectionRef = collection(db, "users", userId, "chats");
      // NEW: Order chats by creation date, newest first
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

  const signInWithGoogle = async () => { /* ... (no change) ... */ };
  const handleSignOut = async () => { /* ... (no change) ... */ };

  // --- Chat Management Logic (NEW FUNCTIONS) ---

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

  // --- Core Interview Logic (MODIFIED) ---

  const handleStartInterview = async () => {
    if (!problem.trim() || !code.trim() || !user) return;
    
    setError(null);
    setIsLoading(true);
    setMessages([]); // Start with a clean slate 

    const initialPrompt = generateInitialPrompt(problem, code);
    const initialHistory = [{ role: 'user', parts: [{ text: initialPrompt }] }];
    
    try {
      const response = await callGeminiAPI(initialHistory);
      const firstBotMessage = { role: 'model', text: response };
      
      // Create a new chat document in Firestore
      const chatData = {
        problem,
        code,
        messages: [firstBotMessage], // Start with the first message
        createdAt: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, "users", user.uid, "chats"), chatData);
      
      setActiveChatId(docRef.id); // Set this new chat as the active one
      setMessages([firstBotMessage]); // Update the UI
      setSavedChats(prev => [{ id: docRef.id, ...chatData }, ...prev]); // Add to the top of the sidebar list

    } catch (error) {
      setError(`Error starting interview: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (userInput) => {
    if (!user || (!activeChatId && messages.length === 0)) {
        // This case handles starting a new chat by just typing a message
        // For simplicity, we'll enforce the "Start Interview" button for now.
        if(!activeChatId) return handleStartInterview();
    }

    const newUserMessage = { role: 'user', text: userInput };
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setIsLoading(true);
    setError(null);

    const historyForApi = updatedMessages.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    }));

    try {
      const response = await callGeminiAPI(historyForApi);
      const newBotMessage = { role: 'model', text: response };
      const finalMessages = [...updatedMessages, newBotMessage];
      setMessages(finalMessages);

      // Update the existing chat document in Firestore
      if (activeChatId) {
        const chatDocRef = doc(db, "users", user.uid, "chats", activeChatId);
        await updateDoc(chatDocRef, {
          messages: finalMessages
        });
      }
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
        <div className="flex w-full h-full">
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
              // Disable inputs if a chat is loaded or ongoing
              interviewStarted={messages.length > 0} 
              error={error}
            />
            <Chat
              messages={messages}
              isLoading={isLoading}
              onSendMessage={handleSendMessage}
              // Show chat window if there are messages
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
