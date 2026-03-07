'use server';
/**
 * @fileOverview This file implements a Genkit flow for an interactive voice tutor.
 *
 * - interactiveVoiceTutor - A function that handles real-time spoken interactions
 *   with a study buddy, generating both text and audio responses.
 * - VoiceTutorInput - The input type for the interactiveVoiceTutor function.
 * - VoiceTutorOutput - The return type for the interactiveVoiceTutor function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import wav from 'wav';

const VoiceTutorInputSchema = z.object({
  query: z.string().describe("The student's spoken query, transcribed into text."),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
  })).describe("Previous turns in the conversation to maintain context."),
});
export type VoiceTutorInput = z.infer<typeof VoiceTutorInputSchema>;

const VoiceTutorOutputSchema = z.object({
  responseAudio: z.string().optional().describe("The AI's spoken response as a base64-encoded WAV audio data URI."),
  responseText: z.string().describe("The AI's generated text response."),
});
export type VoiceTutorOutput = z.infer<typeof VoiceTutorOutputSchema>;

export async function interactiveVoiceTutor(input: VoiceTutorInput): Promise<VoiceTutorOutput> {
  return interactiveVoiceTutorFlow(input);
}

// Helper function to convert PCM audio buffer to WAV format
async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs = [] as any[];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}


const interactiveVoiceTutorFlow = ai.defineFlow(
  {
    name: 'interactiveVoiceTutorFlow',
    inputSchema: VoiceTutorInputSchema,
    outputSchema: VoiceTutorOutputSchema,
  },
  async (input) => {
    // Map history to Genkit 1.x message format with parts
    const messages = input.conversationHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model' as const,
      content: [{ text: msg.content }]
    }));

    // Add the current user query
    messages.push({
      role: 'user',
      content: [{ text: input.query }],
    });

    // 1. Generate text response from the conversational model
    const textResponse = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      system: `You are a helpful and patient study buddy. Your goal is to explain complex topics, answer questions, and provide clarifications in an easy-to-understand manner. 
      
      CRITICAL INSTRUCTION ON CONTEXT:
      - Always prioritize the user's LATEST query. 
      - If the user changes the topic (e.g., switches from Physics to a website or software), pivot immediately.
      - Do NOT try to force a connection to the previous topic unless the user explicitly asks you to compare them.
      - Use conversation history only to understand references (like "it", "that", "why?") within the SAME topic.
      
      Keep your responses concise and directly address the student's query.`,
      messages: messages,
      config: {
        maxOutputTokens: 300,
      },
    });

    const responseText = textResponse.text || "I'm sorry, I couldn't generate a text response.";

    // 2. Convert the generated text response to speech (with quota resiliency)
    let responseAudio: string | undefined = undefined;
    try {
      const speechResponse = await ai.generate({
        model: googleAI.model('gemini-2.5-flash-preview-tts'),
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Algenib' },
            },
          },
        },
        prompt: responseText,
      });

      if (speechResponse.media) {
        const audioBuffer = Buffer.from(
          speechResponse.media.url.substring(speechResponse.media.url.indexOf(',') + 1),
          'base64'
        );
        const wavAudioBase64 = await toWav(audioBuffer);
        responseAudio = 'data:audio/wav;base64,' + wavAudioBase64;
      }
    } catch (error) {
      // If TTS fails (quota exhausted, etc.), we still return the text response
      console.warn('TTS generation failed, proceeding with text only:', error);
    }

    return {
      responseAudio,
      responseText: responseText,
    };
  }
);
