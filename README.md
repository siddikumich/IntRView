LeetCode AI Interviewer
An interactive, AI-powered platform designed to simulate the experience of a real technical interview. This tool helps bridge the gap between solving a coding problem and articulating the solution under pressure.

The Motivation
As I was strengthening my resume and preparing for my own LeetCode journey, I realized that getting the right answer is only half the battle. The other half is explaining your thought process clearly and confidently, just like you would in a high-pressure technical interview.

I though, what better way to practice this than to build the tool I needed myself?

This project was born from that idea. It's not just a one-and-done portfolio piece; it's a practical tool that I continue to use to sharpen my own skills. More importantly, it was a significant learning experience for me, serving as my deep dive into building a full-stack application with a modern tech stack.

How It Works
The current version provides a robust core experience. A user can:

Input a LeetCode-style problem description into the application.

Provide their own code solution to that problem.

Initiate an interview session. The Google Gemini AI, acting as a senior engineer, will then begin asking probing questions about the user's solution, focusing on time/space complexity, data structure choices, and edge cases.

Tech Stack
This application was built from the ground up using a modern, industry-standard tech stack. A primary goal of this project was to learn and master these technologies:

Frontend: React, JavaScript (ES6+), Vite

Styling: Tailwind CSS

Backend & Database: Node.js, Express, Firebase Authentication, Firestore

AI: Google Gemini API

Future Roadmap
The current application serves as a powerful Minimum Viable Product (MVP). I have a clear vision for expanding its capabilities to create an even more realistic and feature-rich training tool. The planned features include:

Full User Account System: Allowing users to sign up, log in, and save their complete chat history to their profile. (DONE)

Voice-to-Voice Interaction: Implementing the Web Speech API to allow users to speak their answers and hear the AI interviewer's questions spoken aloud, further simulating a real interview.(WIP)

Diagram Input: Adding a canvas/whiteboard feature for users to visually draw out their data structures or algorithms when prompted.(WIP)

Smart Problem Tagging: Creating a feature where the AI analyzes the problem description and automatically suggests relevant tags (e.g., "Arrays", "Two Pointers", "Dynamic Programming").(WIP)