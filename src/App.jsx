import { useState } from 'react';
import ProblemInput from './components/ProblemInput';
import Chat from './components/Chat';
import { callGeminiAPI, generateInitialPrompt } from './services/api';

function App() {
  const [problem, setProblem] = useState('');
  const [code, setCode] = useState('');
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

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
      setMessages(prev => [...prev, { role: 'model', text: response }]);
    } catch (error) {
      console.error("Error sending message:", error);
      setError(`Error fetching response: ${error.message}`);
      setMessages(prev => [...prev, { role: 'model', text: 'My apologies, I encountered an error. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

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