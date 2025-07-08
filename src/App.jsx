import { useState, useEffect } from 'react';
import ProblemInput from './components/ProblemInput';
import Chat from './components/Chat';
import { callGeminiAPI, generateInitialPrompt } from './services/api';
import { saveChatToFirestore, getChatsFromFirestore } from './services/api'; 

//app gets imported to main.jsx 
function App() {
  const [problem, setProblem] = useState('');
  const [code, setCode] = useState('');
  const [isInitialLoading, setIsInitialLoading] = useState(true); //firebaseFix
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const MOCK_USER_ID = "test-user-123"; //THIS IS FOR TESTING THE USER FUNCTION


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
      await saveChatToFirestore(MOCK_USER_ID, {
        problem: problem,
        code: code,
        messages: updatedMessages 
      });

    } catch (error) {
      console.error("Error sending message:", error);
      setError(`Error fetching response: ${error.message}`);
      // ERROR MESSAGE
      setMessages(prev => [...prev, { role: 'model', text: 'My apologies, I encountered an error. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };
  //TESTING FIREBASE
    useEffect(() => {
        const testFetch = async () => {
        const MOCK_USER_ID = "test-user-123"; 
    
        console.log("Attempting to fetch chats for user:", MOCK_USER_ID);
        try {
            const userChats = await getChatsFromFirestore(MOCK_USER_ID);
            console.log("Fetched Chats:", userChats);
        } catch (error) {
            console.error("Could not fetch chats.", error);
            setError("Could not load previous chats. Please check your connection or Firebase setup.");
        } finally {
            setIsInitialLoading(false);
        }
        };
    
        testFetch();
    }, []); // The empty array [] is correct, it means this runs only once.
  return (
    <div className="flex h-screen bg-gray-900 text-white font-sans">
      <ProblemInput
        problem={problem}
        setProblem={setProblem}
        code={code}
        setCode={setCode}
        onStartInterview={handleStartInterview}
        interviewStarted={interviewStarted}
        error={error}
      />
      
      <Chat
        messages={messages}
        isLoading={isLoading}
        onSendMessage={handleSendMessage}
        interviewStarted={interviewStarted}
      />
    </div>
  );

}

export default App;