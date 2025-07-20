import { useState, useEffect } from 'react';
import ProblemInput from './components/ProblemInput';
import Chat from './components/Chat';
import { callGeminiAPI, generateInitialPrompt } from './services/api';
import { saveChatToFirestore, getChatsFromFirestore } from './services/api'; 
import { auth } from './firebase'; 
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import Navbar from './components/Navbar';

//app gets imported to main.jsx 
function App() {
  const [problem, setProblem] = useState('');
  const [code, setCode] = useState('');
  const [isInitialLoading, setIsInitialLoading] = useState(true); //firebaseFix
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const MOCK_USER_ID = "test-user-123"; //THIS IS FOR TESTING THE USER FUNCTION

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
    }
  };
  const getChatsForUser = async (userId) => {
    console.log("Fetching chats for user:", userId);
    try {
        const userChats = await getChatsFromFirestore(userId);
        console.log("Fetched Chats:", userChats);
        // setSavedChats(userChats);
    } catch (error) {
        console.error("Could not fetch user chats.", error);
    }
};
  const handleStartInterview = async () => {
    if (!problem.trim() || !code.trim()) {
      setError('Please provide both the problem description and your code.');
      return;
    }
    
    setError(null);
    setInterviewStarted(true);
    setIsLoading(true);

    const initialPrompt = generateInitialPrompt(problem, code);
    const initialHistory = [{ role: 'user', parts: [{ text: initialPrompt }] }];
    
    try {
      const response = await callGeminiAPI(initialHistory);
      setMessages([{ role: 'model', text: response }]);
    } catch (error) {
      console.error("Error starting interview:", error);
      setError(`Error starting interview: ${error.message}`);
      setMessages([]);
      setInterviewStarted(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (userInput) => {
    const newUserMessage = { role: 'user', text: userInput };
    const historyForApi = [...messages.map(msg => ({
      role: msg.role === 'model' ? 'model' : 'user',
      parts: [{ text: msg.text }]
    })), { role: 'user', parts: [{ text: userInput }] }];

    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // 1. Call the API ONCE to get the AI's response
      const response = await callGeminiAPI(historyForApi);
      
      // 2. Create the final, complete list of messages
      const updatedMessages = [...messages, newUserMessage, { role: 'model', text: response }];

      // 3. Update the UI with the AI's response
      setMessages(updatedMessages);
      
      // 4. Save the complete, final chat to Firestore
      if (user) { // Only save if a user is logged in
        await saveChatToFirestore(user.uid, {
          problem: problem,
          code: code,
          messages: updatedMessages
        });
      }

    } catch (error) {
      console.error("Error sending message:", error);
      setError(`Error fetching response: ${error.message}`);
      // ERROR MESSAGE
      setMessages(prev => [...prev, { role: 'model', text: 'My apologies, I encountered an error. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };
  //TESTING FIREBASE AND GOOGLE LOG IN 
  useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser); // Set the user state
        if (currentUser) {
            console.log("User is logged in:", currentUser);
            getChatsForUser(currentUser.uid);
        } else {
            console.log("User is logged out.");
        }
        });
    
        return () => unsubscribe();
    }, []);
        return (
            <div className="flex h-screen bg-gray-900 text-white font-sans relative">
            <Navbar user={user} signInWithGoogle={signInWithGoogle} signOut={handleSignOut} />
        
            {/* If a user is logged in, show the app. Otherwise, show a welcome message. */}
            {user ? (
                <>
                <ProblemInput
                   
                />
                <Chat
                />
                </>
            ) : (
                <div className="w-full flex flex-col items-center justify-center">
                <h1 className="text-4xl font-bold text-cyan-400 mb-4">Welcome to the AI Interviewer</h1>
                <p className="text-gray-400 mb-8">Please sign in to start your interview practice.</p>
                <button
                    onClick={signInWithGoogle}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition-transform transform hover:scale-105"
                >
                    Sign in with Google
                </button>
                </div>
            )}
            </div>
        );

}

export default App;