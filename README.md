
# Buddy AI

Buddy AI is a hands-free AI visual tutor that sees, hears, and explains your study materials in real-time.

## Project Story

### Inspiration
Late one night, staring at a complex diagram of the human nervous system, we realized that the hardest part of learning isn't the difficulty of the material—it's the friction of being stuck alone. Textbooks are static, and searching for answers requires you to break your "flow" to type into a search bar. We were inspired to build a companion that doesn't just "chat," but actually *sees* what you're looking at, providing the same kind of over-the-shoulder guidance a human tutor would. We wanted to transform the lonely 2 AM study session into a collaborative experience.

### What it does
Buddy AI is a hands-free visual tutor. It uses your camera to analyze study materials—from handwritten calculus problems to intricate biology diagrams—and explains them using a natural, conversational voice. 

Key features include:
- **Continuous Listening**: A seamless, hands-free conversation loop that automatically restarts after every Buddy response, allowing for natural follow-up questions.
- **Visual Intelligence**: Real-time analysis of diagrams, text, or textbook pages using multimodal AI.
- **Dynamic Annotations**: Buddy doesn't just talk; it can "draw" on your material, overlaying highlights and pointers to guide your eyes to the most important parts of a diagram.
- **Intelligent Summaries**: At the end of every session, Buddy generates a structured study guide based on the specific topics you covered.

### How we built it
We built Buddy AI using **Next.js 15** and **React 19** to ensure a high-performance, responsive interface. The AI orchestration is powered by **Genkit**, managing several specialized flows:
- **Gemini 2.5 Flash** handles the core conversational reasoning and context management.
- **Gemini 2.5 Flash Image** powers the visual analysis and image-to-image annotation.
- **Gemini 2.5 Flash Preview TTS** provides the spoken voice responses, turning text into clear, helpful instruction.

### Challenges we ran into
The biggest hurdle was the "Hands-Free Loop." We had to solve the "Self-Hearing" problem—preventing the microphone from "listening" to the AI's own voice while ensuring it was ready the instant the student wanted to speak. We also faced tight token quotas, which forced us to implement aggressive context truncation and prompt optimization to maintain a long-running, intelligent conversation without hitting rate limits.

### Accomplishments that we're proud of
We are particularly proud of the "Continuous Listening" feature. It transforms the app from a simple "push-to-talk" tool into a living presence that feels like it's actually studying *with* you. Seeing the AI accurately identify a handwritten formula and then draw an arrow to the specific part a student is confused about felt like a glimpse into the future of education.

### What we learned
We learned that multimodal AI is most powerful when it disappears into the background. Building a low-latency experience where vision, text, and voice work in harmony taught us deep lessons about state management in React and the nuances of prompt engineering for visual tasks.

### What's next for Buddy AI
- **Collaborative Study Rooms**: Multiple students sharing a single Buddy session across different devices.
- **Interactive Quizzing**: The Buddy proactively testing the student based on the materials it has seen.
- **LMS Integration**: Syncing session summaries directly to platforms like Canvas or Google Classroom to track persistent knowledge gaps.

## Media Gallery (Submission Assets)

For your hackathon submission, you can use the following generated placeholders which are optimized for a 3:2 ratio:

1. **The Visual Tutor in Action**: [https://picsum.photos/seed/buddy-hero/1200/800](https://picsum.photos/seed/buddy-hero/1200/800)
   - *Caption*: Buddy AI identifying a complex handwritten equation with a real-time conversational explanation.
2. **Dynamic Highlights**: [https://picsum.photos/seed/buddy-diagram/1200/800](https://picsum.photos/seed/buddy-diagram/1200/800)
   - *Caption*: A visual showcasing Buddy "drawing" on a plant cell diagram to explain mitochondrial function.
3. **The Hands-Free Loop**: [https://picsum.photos/seed/buddy-ui/1200/800](https://picsum.photos/seed/buddy-ui/1200/800)
   - *Caption*: Capturing the active microphone state and the clean, intuitive conversation flow.
4. **Knowledge Recap**: [https://picsum.photos/seed/buddy-summary/1200/800](https://picsum.photos/seed/buddy-summary/1200/800)
   - *Caption*: A view of the generated "Session Summary" showing structured insights from a study session.

## Built with
- **Frameworks**: Next.js 15, React 19
- **AI Orchestration**: Genkit
- **Models**: Gemini 2.5 (Flash, Image, TTS)
- **Styling**: Tailwind CSS, ShadCN UI
- **Icons**: Lucide React
- **Hosting**: Firebase App Hosting
