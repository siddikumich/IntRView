import React from 'react';

const ChatBubbleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

export default function Sidebar({ savedChats, onSelectChat, onNewChat, activeChatId }) {
  return (
    <div className="w-1/4 max-w-xs p-4 flex flex-col bg-gray-800 border-r border-gray-700">
      <h2 className="text-xl font-bold text-white mb-4">Chat History</h2>
      <button
        onClick={onNewChat}
        className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg mb-4 transition-colors"
      >
        + New Chat
      </button>
      <div className="flex-1 overflow-y-auto space-y-2">
        {savedChats.length > 0 ? (
          savedChats.map(chat => (
            <button
              key={chat.id}
              onClick={() => onSelectChat(chat.id)}
              className={`w-full text-left p-2 rounded-md flex items-center gap-3 transition-colors ${
                activeChatId === chat.id 
                ? 'bg-cyan-800 text-white' 
                : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <ChatBubbleIcon />
              <span className="truncate flex-1">
                {/* Use the first few words of the problem as the title */}
                {chat.problem?.split(' ').slice(0, 5).join(' ') || 'Untitled Chat'}
              </span>
            </button>
          ))
        ) : (
          <p className="text-gray-500 text-sm text-center mt-4">No saved chats yet.</p>
        )}
      </div>
    </div>
  );
}
