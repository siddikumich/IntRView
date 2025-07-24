// Icon components separated for better organization
export const Icon = ({ path, className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d={path} />
    </svg>
  );
  
  export const UserIcon = ({ className = "w-6 h-6" }) => (
    <Icon 
      path="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" 
      className={className}
    />
  );
  
  export const BotIcon = ({ className = "w-6 h-6" }) => (
    <Icon 
      path="M15 9H9V7h6v2zm-2 4H9v-2h4v2zm8-2V9h-2V7h-2V5h-2v2h-2v2h2v2H9v2H7v2h2v2h2v-2h2v-2h2v-2h2v2h2v-2zm-4-4V5h-2v2h2zM5 5h2v2H5V5zm-2 12v-2h2v2H3zm2 2v-2h2v2H5z" 
      className={className}
    />
  );
  
  export const SendIcon = ({ className = "w-6 h-6" }) => (
    <Icon 
      path="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" 
      className={className}
    />
  );
  //adding this for voice chat
  export const MicrophoneIcon = ({ className = "w-6 h-6" }) => (
    <Icon
      path="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.49 6-3.31 6-6.72h-1.7z"
      className={className}
    />
  );