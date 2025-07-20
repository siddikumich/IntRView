import { useState, useEffect } from 'react';
import ProblemInput from './components/ProblemInput';
import Chat from './components/Chat';
import { callGeminiAPI, generateInitialPrompt } from './services/api';
import { saveChatToFirestore, getChatsFromFirestore } from './services/api'; 
import { auth } from './firebase'; 
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged } from "firebase/auth";
import Navbar from './components/Navbar';

//app gets imported to main.jsx 
function App() {
  const [problem, setProblem] = useState('');
  const [code, setCode] = useState('');
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(false); // Add loading state for auth
  const MOCK_USER_ID = "test-user-123";

  const signInWithGoogle = async () => {
    if (authLoading) return;
    
    setAuthLoading(true);
    setError(null);
    
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    
    try {
      console.log("Starting Google sign-in...");
      
      // Try popup first, fallback to redirect if it fails
      try {
        const result = await signInWithPopup(auth, provider);
        console.log("Sign-in successful:", result.user);
      } catch (popupError) {
        console.log("Popup failed, trying redirect...", popupError);
        
        if (popupError.code === 'auth/api-key-not-valid') {
          throw popupError; // Don't retry redirect for API key issues
        }
        
        // Use redirect as fallback
        await signInWithRedirect(auth, provider);
        return; // signInWithRedirect doesn't return a result immediately
      }
      
    } catch (error) {
      console.error("Error signing in with Google: ", error);
      
      if (error.code === 'auth/api-key-not-valid') {
        setError("Authentication configuration error. Please check if localhost is authorized in Firebase Console.");
      } else if (error.code === 'auth/popup-closed-by-user') {
        setError("Sign-in was cancelled. Please try again.");
      } else if (error.code === 'auth/popup-blocked') {
        setError("Popup was blocked. Trying redirect method...");
        // Try redirect as backup
        try {
          await signInWithRedirect(auth, provider);
          return;
        } catch (redirectError) {
          setError("Both popup and redirect failed. Please check your Firebase configuration.");
        }
      } else {
        setError(`Failed to sign in: ${error.message}`);
      }
    } finally {
      setAuthLoading(false);
    }
  };
  
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setMessages([]); // Clear messages on sign out
      setInterviewStarted(false);
      setProblem('');
      setCode('');
    } catch (error) {
      console.error("Error signing out: ", error);
      setError("Failed to sign out.");
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
      const response = await callGeminiAPI(historyForApi);
      const updatedMessages = [...messages, newUserMessage, { role: 'model', text: response }];
      setMessages(updatedMessages);
      
      if (user) {
        await saveChatToFirestore(user.uid, {
          problem: problem,
          code: code,
          messages: updatedMessages
        });
      }

    } catch (error) {
      console.error("Error sending message:", error);
      setError(`Error fetching response: ${error.message}`);
      setMessages(prev => [...prev, { role: 'model', text: 'My apologies, I encountered an error. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsInitialLoading(true);
    
    // Handle redirect result
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          console.log("Redirect sign-in successful:", result.user);
        }
      })
      .catch((error) => {
        console.error("Redirect sign-in error:", error);
        setError(`Redirect sign-in failed: ${error.message}`);
      });
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        console.log("User is logged in:", currentUser);
        getChatsForUser(currentUser.uid);
      } else {
        console.log("User is logged out.");
      }
      setIsInitialLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Show loading spinner while checking auth state
  if (isInitialLoading) {
    return (
      <div className="flex h-screen bg-gray-900 text-white items-center justify-center">
        <div className="text-cyan-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900 text-white font-sans relative">
      <Navbar user={user} signInWithGoogle={signInWithGoogle} signOut={handleSignOut} />
  
      {/* Show error message if there's an authentication error */}
      {error && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded-lg z-50">
          {error}
          <button 
            onClick={() => setError(null)}
            className="ml-2 text-white hover:text-gray-300"
          >
            ×
          </button>
        </div>
      )}

      {user ? (
        <>
          <ProblemInput
            problem={problem}
            setProblem={setProblem}
            code={code}
            setCode={setCode}
            onStartInterview={handleStartInterview}
            isLoading={isLoading}
            interviewStarted={interviewStarted}
          />
          <Chat
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            interviewStarted={interviewStarted}
          />
        </>
      ) : (
        <div className="w-full flex flex-col items-center justify-center">
          <h1 className="text-4xl font-bold text-cyan-400 mb-4">Welcome to the AI Interviewer</h1>
          <p className="text-gray-400 mb-8">Please sign in to start your interview practice.</p>
          <button
            onClick={signInWithGoogle}
            disabled={authLoading}
            className={`font-bold py-3 px-6 rounded-lg text-lg transition-transform transform hover:scale-105 ${
              authLoading 
                ? 'bg-gray-600 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {authLoading ? 'Signing in...' : 'Sign in with Google'}
          </button>
        </div>
      )}
    </div>
  );
}

export default App;