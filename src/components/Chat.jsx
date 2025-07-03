import { useState, useRef, useEffect } from 'react';
import { BotIcon, UserIcon, SendIcon } from './Icons';

export default function Chat({ messages, isLoading, onSendMessage, interviewStarted }) {
  const [userInput, setUserInput] = useState('');
  const chatEndRef = useRef(null);

  // Automatically scroll to the bottom of the chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading) return;

    onSendMessage(userInput);
    setUserInput('');
  };

  return (
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
              {msg.role === 'model' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                  <BotIcon />
                </div>
              )}
              <div className={`p-3 rounded-lg max-w-lg ${msg.role === 'model' ? 'bg-gray-700' : 'bg-cyan-800'}`}>
                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              </div>
              {msg.role === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                  <UserIcon />
                </div>
              )}
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
              <BotIcon />
            </div>
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
      
      <form onSubmit={handleSubmit} className={`mt-4 flex items-center space-x-2 ${!interviewStarted ? 'hidden' : ''}`}>
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          className="flex-1 p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none transition"
          placeholder="Your answer..."
          disabled={isLoading}
        />
        <button 
          type="submit" 
          className="bg-cyan-600 hover:bg-cyan-700 p-3 rounded-lg disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors" 
          disabled={isLoading}
        >
          <SendIcon />
        </button>
      </form>
    </div>
  );
}