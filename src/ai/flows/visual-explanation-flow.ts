'use server';
/**
 * @fileOverview A Genkit flow for real-time visual analysis and spoken explanations.
 *
 * - visualExplanation - A function that analyzes visual learning materials and provides spoken explanations.
 * - VisualExplanationInput - The input type for the visualExplanation function.
 * - VisualExplanationOutput - The return type for the visualExplanation function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import {vertexAI} from '@genkit-ai/vertexai';
import { Buffer } from 'buffer';
import wav from 'wav';

// Input schema for the visual explanation flow
const VisualExplanationInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a visual learning material (e.g., diagram, textbook page, graph), as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  context: z.string().optional().describe('Optional context or specific question to guide the explanation.'),
});
export type VisualExplanationInput = z.infer<typeof VisualExplanationInputSchema>;

// Output schema for the visual explanation flow
const VisualExplanationOutputSchema = z.object({
  audioDataUri: z.string().optional().describe('The spoken explanation of the visual material, as a data URI with audio/wav MIME type.'),
  explanationText: z.string().describe('The text version of the visual explanation.'),
});
export type VisualExplanationOutput = z.infer<typeof VisualExplanationOutputSchema>;

/**
 * Converts PCM audio data to WAV format and returns it as a base64 encoded string.
 * @param pcmData The PCM audio data buffer.
 * @param channels Number of audio channels (default 1).
 * @param rate Sample rate in Hz (default 24000).
 * @param sampleWidth Sample width in bytes (default 2).
 * @returns A Promise that resolves with the base64 encoded WAV string.
 */
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

// Define the prompt for generating the text explanation
const explainVisualPrompt = ai.definePrompt({
  name: 'explainVisualPrompt',
  input: { schema: VisualExplanationInputSchema },
  output: { schema: z.object({ explanation: z.string().describe('A clear, context-aware explanation of the visual material.') }) },
  prompt: `You are an expert tutor for students, specializing in explaining complex visual learning materials like diagrams, textbook pages, and graphs. Your goal is to help students quickly understand the content without manual input.

Analyze the provided image and provide a clear, concise, and context-aware spoken explanation suitable for a student.

If the user provides a context or question, use that to guide your explanation.

Context/Question: {{{context}}}
Photo: {{media url=photoDataUri}}`,
});

// Define the main Genkit flow for visual explanation
const visualExplanationFlow = ai.defineFlow(
  {
    name: 'visualExplanationFlow',
    inputSchema: VisualExplanationInputSchema,
    outputSchema: VisualExplanationOutputSchema,
  },
  async (input) => {
    // First, generate the text explanation from the visual input
    const { output: textOutput } = await explainVisualPrompt(input);
    const explanationText = textOutput?.explanation;

    if (!explanationText) {
      throw new Error('Failed to generate a text explanation from the visual input.');
    }

    // Then, convert the text explanation to speech (resilient to quota)
    let audioDataUri: string | undefined = undefined;
    try {
      const { media } = await ai.generate({
        model: 'vertexai/gemini-1.5-flash',
        prompt: explanationText,
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Algenib' },
            },
          },
        },
      });

      if (media) {
        const audioBuffer = Buffer.from(
          media.url.substring(media.url.indexOf(',') + 1),
          'base64'
        );
        const wavBase64 = await toWav(audioBuffer);
        audioDataUri = 'data:audio/wav;base64,' + wavBase64;
      }
    } catch (error) {
      console.warn('Visual TTS generation failed, proceeding with text only:', error);
    }

    return {
      audioDataUri,
      explanationText,
    };
  }
);

/**
 * Analyzes visual learning materials (diagrams, textbook pages, graphs) and provides
 * clear, context-aware spoken explanations for students.
 * @param input The visual input, including a photo data URI and optional context.
 * @returns An object containing the spoken explanation as an audio data URI and text.
 */
export async function visualExplanation(input: VisualExplanationInput): Promise<VisualExplanationOutput> {
  return visualExplanationFlow(input);
}
