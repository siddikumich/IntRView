import { db } from '../firebase';
import { collection, addDoc, getDocs, query, where, serverTimestamp } from "firebase/firestore";
// API service for Gemini API calls
export const callGeminiAPI = async (chatHistory) => {
    // Get API key from environment variables
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error("API Key not found. Please add VITE_GEMINI_API_KEY to your .env file.");
    }
  
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  
    const payload = {
      contents: chatHistory,
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
    
    if (result.candidates && result.candidates.length > 0 && result.candidates[0].content && result.candidates[0].content.parts && result.candidates[0].content.parts.length > 0) {
      return result.candidates[0].content.parts[0].text;
    } else {
      console.error("Unexpected API response structure or content blocked:", result);
      throw new Error("The response was blocked or empty. Please try rephrasing your message.");
    }
  };
  
  // Generate the initial interview prompt
  export const generateInitialPrompt = (problem, code) => {
    return `You are a demanding but fair senior engineer at a top tech company. Your goal is to conduct a rigorous technical interview and find the limits of the user's knowledge.
  
  RULES:
  1.  Engage in a dialogue. Do NOT lecture.
  2.  Ask only ONE open-ended question at a time.
  3.  NEVER summarize the user's answer and say "Thanks" or "Good." Instead, ask a follow-up question.
  4.  Your response MUST ALWAYS end with a single, specific, probing question.
  
  Here is the problem and the user's solution:
  PROBLEM: """${problem}"""
  SOLUTION: """${code}"""
  
  INTERVIEW FLOW:
  1.  Start by asking the user for a high-level explanation of their approach.
  2.  After their explanation, your NEXT question MUST be about the Time and Space Complexity of their solution.
  3.  Then, probe them on potential edge cases they might have missed.
  4.  Finally, ask them about alternative solutions and the trade-offs involved.
  
  Begin the interview now.`;
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