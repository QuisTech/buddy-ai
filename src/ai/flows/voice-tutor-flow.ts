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
  responseAudio: z.string().describe("The AI's spoken response as a base64-encoded WAV audio data URI."),
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
    const messages = input.conversationHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      content: msg.content
    }));

    messages.push({
      role: 'user',
      content: input.query,
    });

    // 1. Generate text response from the conversational model
    const textResponse = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt: {
        system: `You are a helpful and patient study buddy. Your goal is to explain complex topics, answer questions, and provide clarifications in an easy-to-understand manner. Keep your responses concise and directly address the student's query. Remember to maintain context from the conversation history.`,
        messages: messages,
      },
      config: {
        maxOutputTokens: 200,
      },
    });

    const responseText = textResponse.output?.text || "I'm sorry, I couldn't generate a text response.";

    // 2. Convert the generated text response to speech
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

    if (!speechResponse.media) {
      throw new Error('No audio media returned from TTS model.');
    }

    const audioBuffer = Buffer.from(
      speechResponse.media.url.substring(speechResponse.media.url.indexOf(',') + 1),
      'base64'
    );

    const wavAudioBase64 = await toWav(audioBuffer);

    return {
      responseAudio: 'data:audio/wav;base64,' + wavAudioBase64,
      responseText: responseText,
    };
  }
);
