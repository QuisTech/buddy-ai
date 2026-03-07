# Buddy AI

Buddy AI is a hands-free AI visual tutor that sees, hears, and explains your study materials in real-time.

## Project Story

## Inspiration
Studying complex diagrams and textbook pages can be lonely and frustrating. We wanted to create a companion that doesn't just "chat" but actually *sees* what you're looking at, providing the same kind of over-the-shoulder guidance a human tutor would. We were inspired by the idea of an "AI pair-learner" that lives on your desk and helps bridge the gap between static content and deep understanding.

## What it does
Buddy AI is a hands-free visual tutor. It uses your camera to analyze study materials—from handwritten math problems to complex biology diagrams—and explains them using natural voice. 

Key features include:
- **Continuous Listening**: A fluid, hands-free conversation loop that restarts automatically after every Buddy response.
- **Visual Intelligence**: Real-time analysis of diagrams, text, or textbook pages.
- **Dynamic Annotations**: The Buddy can overlay highlights and pointers directly onto your study material to guide your eyes.
- **Session Summaries**: Automatically generates key takeaways and study guides at the end of every session.

## How we built it
We built Buddy AI using **Next.js 15** and **React 19**. The heart of the application is a series of AI flows orchestrated by **Genkit**:
- **Gemini 2.5 Flash** handles the core conversational reasoning.
- **Gemini 2.5 Flash Image** powers the visual analysis and image-to-image annotation.
- **Gemini 2.5 Flash Preview TTS** provides the spoken voice responses.

The UI is built with **Tailwind CSS** and **ShadCN UI**, emphasizing a clean, "Space Grotesk" aesthetic designed to minimize cognitive load.

## Challenges we ran into
One of the biggest hurdles was managing the "hands-free" loop. We had to carefully synchronize the browser's Speech Recognition API with the AI's response cycle to prevent the mic from "hearing" the AI speak while ensuring it was ready the moment the user wanted to follow up. We also had to implement aggressive token optimization to stay within free-tier quota limits while maintaining high-quality visual context.

## Accomplishments that we're proud of
We are particularly proud of the "Continuous Listening" feature. It transforms the app from a simple "push-to-talk" tool into a living presence that feels like it's actually studying *with* you. Seeing the AI accurately identify a handwritten formula and then draw an arrow to the specific part a student is confused about felt like magic.

## What we learned
We learned a lot about the nuances of multi-modal AI—how to effectively combine vision, text, and voice into a single low-latency experience. We also gained deep experience in prompt engineering for complex visual tasks and managing browser-based hardware APIs (Camera and Mic) in a responsive React environment.

## What's next for Buddy AI
We plan to add:
- **Collaborative Study Rooms**: Multiple students sharing a single Buddy session.
- **LMS Integration**: Tracking study progress and identifying persistent knowledge gaps over time.
- **Interactive Quizzing**: The Buddy proactively testing the student based on the materials it has seen.

## Built with
- **Frameworks**: Next.js 15, React 19
- **Styling**: Tailwind CSS, ShadCN UI
- **AI Orchestration**: Genkit
- **Models**: Gemini 2.5 (Flash, Image, TTS)
- **Icons**: Lucide React
- **Hosting**: Firebase App Hosting
