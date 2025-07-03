import React, { useState, useRef, useEffect } from 'react';

// Helper component for icons
const Icon = ({ path, className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d={path} />
    </svg>
);

const UserIcon = () => <Icon path="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />;
const BotIcon = () => <Icon path="M15 9H9V7h6v2zm-2 4H9v-2h4v2zm8-2V9h-2V7h-2V5h-2v2h-2v2h2v2H9v2H7v2h2v2h2v-2h2v-2h2v-2h2v2h2v-2zm-4-4V5h-2v2h2zM5 5h2v2H5V5zm-2 12v-2h2v2H3zm2 2v-2h2v2H5z" />;

// Main App Component
export default function App() {
    const [problem, setProblem] = useState('');
    const [code, setCode] = useState('');
    const [interviewStarted, setInterviewStarted] = useState(false);
    const [messages, setMessages] = useState([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const chatEndRef = useRef(null);

    // Automatically scroll to the bottom of the chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleStartInterview = async () => {
        if (!problem.trim() || !code.trim()) {
            alert('Please provide both the problem description and your code.');
            return;
        }
        
        setInterviewStarted(true);
        setIsLoading(true);

        const initialMessages = [
            {
                role: 'user',
                parts: [{ text: `You are a senior engineer at a top tech company (like Google or Meta) conducting a technical interview. Your tone should be professional, encouraging, but also probing. The user has provided a LeetCode-style problem and their solution.

                Your task is to engage in a dialogue to assess their understanding. Do NOT solve the problem for them or give them the answer. Ask one open-ended question at a time to see how they think.

                Here is the problem:
                ---
                ${problem}
                ---

                Here is the user's code solution:
                ---
                ${code}
                ---

                Start the interview by asking them to explain their overall approach in a sentence or two. Then, wait for their response.` }]
            }
        ];
        
        // This is where you will call the Gemini API
        // For now, we'll simulate a response.
        try {
            // const response = await callGeminiAPI(initialMessages); // Your actual API call here
            const simulatedResponse = "Thank you for sharing your code. Could you briefly walk me through your overall approach to solving this problem?";
            setMessages([{ role: 'model', text: simulatedResponse }]);
        } catch (error) {
            console.error("Error starting interview:", error);
            setMessages([{ role: 'model', text: 'Sorry, I seem to be having trouble starting the interview. Please try again.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!userInput.trim() || isLoading) return;

        const newUserMessage = { role: 'user', text: userInput };
        const currentMessages = [...messages, newUserMessage];
        setMessages(currentMessages);
        setUserInput('');
        setIsLoading(true);

        // Construct the history for the API call
        const apiHistory = currentMessages.map(msg => ({
            role: msg.role === 'model' ? 'model' : 'user',
            parts: [{ text: msg.text }]
        }));

        // This is where you will make subsequent calls to the Gemini API
        try {
            // const response = await callGeminiAPI(apiHistory); // Your actual API call here
            const simulatedResponse = "That's an interesting way to put it. What is the time and space complexity of this solution, and can you explain why?";
            setMessages(prev => [...prev, { role: 'model', text: simulatedResponse }]);
        } catch (error) {
            console.error("Error sending message:", error);
            setMessages(prev => [...prev, { role: 'model', text: 'My apologies, I encountered an error. Could you repeat that?' }]);
        } finally {
            setIsLoading(false);
        }
    };
    
    // **GEMINI API CALL FUNCTION**
    // Replace this with your actual fetch call to the Gemini API
    const callGeminiAPI = async (chatHistory) => {
        const apiKey = ""; // Leave empty, it will be handled by the environment
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        // The first message in the history is the system prompt. We don't resend it every time.
        // We structure the payload with the full history for context.
        const payload = {
            contents: chatHistory,
            // Add safety settings and generation config if needed
        };

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`API call failed with status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
          return result.candidates[0].content.parts[0].text;
        } else {
          // Handle cases where the response structure is unexpected or content is missing
          // It could also be that the content was blocked due to safety settings.
          console.error("Unexpected API response structure or content blocked:", result);
          return "I'm sorry, I'm not sure how to respond to that. Let's try a different question. Can you explain your choice of data structures?";
        }
    };


    return (
        <div className="flex h-screen bg-gray-900 text-white font-sans">
            {/* Left Panel: Problem and Code Input */}
            <div className="w-1/2 p-6 flex flex-col space-y-4 overflow-y-auto">
                <h1 className="text-3xl font-bold text-cyan-400">LeetCode AI Interviewer</h1>
                <p className="text-gray-400">Paste your problem and code below, then start the interview.</p>
                
                <div>
                    <label htmlFor="problem" className="block text-sm font-medium text-gray-300 mb-2">Problem Description</label>
                    <textarea
                        id="problem"
                        rows="10"
                        className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none transition"
                        placeholder="e.g., Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target."
                        value={problem}
                        onChange={(e) => setProblem(e.target.value)}
                        disabled={interviewStarted}
                    />
                </div>
                
                <div>
                    <label htmlFor="code" className="block text-sm font-medium text-gray-300 mb-2">Your Code Solution</label>
                    <textarea
                        id="code"
                        rows="15"
                        className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg font-mono text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none transition"
                        placeholder="e.g., function twoSum(nums, target) { ... }"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        disabled={interviewStarted}
                    />
                </div>

                {!interviewStarted && (
                    <button
                        onClick={handleStartInterview}
                        className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105"
                    >
                        Start Interview
                    </button>
                )}
            </div>

            {/* Right Panel: Chat Interview */}
            <div className="w-1/2 p-6 flex flex-col bg-gray-800 border-l border-gray-700">
                <h2 className="text-2xl font-bold text-gray-200 mb-4">Technical Interview</h2>
                <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                    {!interviewStarted ? (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-gray-500">The interview will appear here.</p>
                        </div>
                    ) : (
                        messages.map((msg, index) => (
                            <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                                {msg.role === 'model' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center"><BotIcon /></div>}
                                <div className={`p-3 rounded-lg max-w-lg ${msg.role === 'model' ? 'bg-gray-700' : 'bg-cyan-800'}`}>
                                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                </div>
                                {msg.role === 'user' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center"><UserIcon /></div>}
                            </div>
                        ))
                    )}
                    {isLoading && (
                         <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center"><BotIcon /></div>
                            <div className="p-3 rounded-lg bg-gray-700">
                                <div className="flex items-center space-x-1">
                                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse delay-0"></span>
                                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse delay-150"></span>
                                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse delay-300"></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>
                <form onSubmit={handleSendMessage} className={`mt-4 flex items-center space-x-2 ${!interviewStarted ? 'hidden' : ''}`}>
                    <input
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        className="flex-1 p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none transition"
                        placeholder="Your answer..."
                        disabled={isLoading}
                    />
                    <button type="submit" className="bg-cyan-600 hover:bg-cyan-700 p-3 rounded-lg disabled:bg-gray-600 disabled:cursor-not-allowed" disabled={isLoading}>
                        <Icon path="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </button>
                </form>
            </div>
        </div>
    );
}