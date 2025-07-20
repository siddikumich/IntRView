import { db } from '../firebase';
import { collection, addDoc, getDocs, query, where, serverTimestamp } from "firebase/firestore";
// API service for Gemini API calls
const SYSTEM_INSTRUCTION = `
You are an AI emulating a senior software engineer from a top-tier tech company (e.g., Google, Meta). You are conducting a rigorous technical interview.

Your persona is sharp, professional, and concise. You are an interviewer, NOT a tutor. Your only goal is to assess the candidate's understanding by asking probing questions.

**ABSOLUTE RULES:**
1.  **NEVER** explain concepts, time complexity, or data structures.
2.  **NEVER** provide hints, suggestions, alternative solutions, or "templates".
3.  **NEVER** praise the user with words like "good," "correct," "great," or "excellent."
4.  **NEVER** summarize or positively rephrase the user's answer.
5.  **ASK, DON'T TELL.** Your entire response must be a question.
6.  **ONE QUESTION ONLY.** End every single response with one, and only one, probing question.
7.  **BE CONCISE.** Keep your responses to a single, short paragraph.

**EXAMPLE OF WHAT NOT TO DO:**
- "That's a good start. The time complexity is O(n) because you iterate once. Now, what about the space complexity?"
**EXAMPLE OF WHAT YOU MUST DO:**
- "You've stated the time complexity. What is the space complexity of your solution?"
`;

export const callGeminiAPI = async (chatHistory) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("VITE_GEMINI_API_KEY is not set in the .env file.");
    }
  
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  
    // The payload now includes the powerful system_instruction field.
    const payload = {
      contents: chatHistory,
      system_instruction: {
        parts: [{ text: SYSTEM_INSTRUCTION }]
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      ],
    };
  
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`API call failed with status: ${response.status}. Body: ${errorBody}`);
    }
  
    const result = await response.json();
    
    if (result.candidates && result.candidates.length > 0 && result.candidates[0].content?.parts?.length > 0) {
      return result.candidates[0].content.parts[0].text;
    } else {
      console.error("API response structure error or content blocked:", result);
      return "I'm sorry, I couldn't process that. Could you please rephrase your answer?";
    }
  };
  
  
  // This function generates the crucial initial prompt that sets the AI's persona.
  export const generateInitialPrompt = (problem, code) => {
    return `
      The interview will now begin. Here is the candidate's submission.
  
      **Problem:**
      \`\`\`
      ${problem}
      \`\`\`
  
      **Solution:**
      \`\`\`
      ${code}
      \`\`\`
  
      Your first task is to ask the candidate to provide a high-level overview of their approach.
    `;
  };
  
  
/**
 * Saves a completed chat session to Firestore for a specific user.
 * @param {string} userId - The ID of the currently logged-in user.
 * @param {object} chatData - An object containing the problem, code, and messages array.
 */
export const saveChatToFirestore = async (userId, chatData) => {
  if (!userId) {
    throw new Error("User is not logged in.");
  }
  try {
    // Create a reference to the user's "chats" sub-collection
    const chatsCollectionRef = collection(db, "users", userId, "chats");
    
    // Add a new document to that collection
    await addDoc(chatsCollectionRef, {
      ...chatData, // This includes problem, code, and messages
      createdAt: serverTimestamp() // Adds a server-side timestamp
    });
    console.log("Chat successfully saved!");
  } catch (error) {
    console.error("Error saving chat to Firestore: ", error);
    throw error; // Re-throw the error to be handled by the component
  }
};

/**
 * Fetches all chat sessions for a specific user.
 * @param {string} userId - The ID of the currently logged-in user.
 * @returns {Promise<Array>} A promise that resolves to an array of chat objects.
 */
export const getChatsFromFirestore = async (userId) => {
  if (!userId) {
    throw new Error("User is not logged in.");
  }
  try {
    const chatsCollectionRef = collection(db, "users", userId, "chats");
    const q = query(chatsCollectionRef); // You could add ordering here later if needed
    
    const querySnapshot = await getDocs(q);
    
    const chats = [];
    querySnapshot.forEach((doc) => {
      chats.push({
        id: doc.id, // The unique ID of the chat document
        ...doc.data() // The content of the chat (problem, code, messages)
      });
    });
    
    console.log("Chats successfully fetched!");
    return chats;
  } catch (error) {
    console.error("Error fetching chats from Firestore: ", error);
throw error;
  }
};