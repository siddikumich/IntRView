import React from 'react';

export default function Navbar({ user, signInWithGoogle, signOut }) {
  return (
    <header className="absolute top-0 right-0 p-4">
      {user ? (
        // If signed in show info
        <div className="flex items-center gap-4">
          <span className="text-white text-sm">Welcome, {user.displayName}</span>
          <img src={user.photoURL} alt="User profile" className="w-10 h-10 rounded-full" />
          <button
            onClick={signOut}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            Sign Out
          </button>
        </div>
      ) : (
        // If not signed in then show sign in option
        <button
          onClick={signInWithGoogle}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
        >
          Sign in with Google
        </button>
      )}
    </header>
  );
}
