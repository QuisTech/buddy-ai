'use server';
/**
 * @fileOverview This file implements a Genkit flow that takes a study material image
 * and an explanation, then generates an annotated version of the image with visual cues
 * corresponding to the explanation. It also returns the explanation.
 *
 * - dynamicAnnotation - A function that handles the dynamic annotation process.
 * - DynamicAnnotationInput - The input type for the dynamicAnnotation function.
 * - DynamicAnnotationOutput - The return type for the dynamicAnnotation function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import {vertexAI} from '@genkit-ai/vertexai';

const DynamicAnnotationInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of study material, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
    ),
  explanation: z.string().describe("The explanation text to guide the annotations."),
});
export type DynamicAnnotationInput = z.infer<typeof DynamicAnnotationInputSchema>;

const DynamicAnnotationOutputSchema = z.object({
  annotatedImageDataUri: z
    .string()
    .describe(
      "The annotated image data URI, with visual highlights or pointers added based on the explanation. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  explanation: z.string().describe("The explanation text, potentially refined."),
});
export type DynamicAnnotationOutput = z.infer<typeof DynamicAnnotationOutputSchema>;

export async function dynamicAnnotation(input: DynamicAnnotationInput): Promise<DynamicAnnotationOutput> {
  return dynamicAnnotationFlow(input);
}

const dynamicAnnotationPrompt = ai.definePrompt({
  name: 'dynamicAnnotationPrompt',
  input: { schema: DynamicAnnotationInputSchema },
  output: { schema: DynamicAnnotationOutputSchema },
  prompt: `You are an expert visual assistant. Your task is to analyze the provided image of study material and an explanation related to it.
Based on the explanation, you need to add dynamic visual annotations, highlights, or pointers directly onto the image to visually guide the student through the explanation.

The annotations should be clear, concise, and directly relate to the explanation provided. If the explanation refers to a specific part of the image (e.g., "the top-left diagram", "the highlighted text", "the curve in the graph"), you must visually mark that part.

Output the result as a JSON object with two fields:
- 'annotatedImageDataUri': A data URI string representing the annotated image (e.g., 'data:image/png;base64,...').
- 'explanation': The original explanation, potentially refined for clarity.

Image: {{media url=photoDataUri}}
Explanation: {{{explanation}}}`,
});

const dynamicAnnotationFlow = ai.defineFlow(
  {
    name: 'dynamicAnnotationFlow',
    inputSchema: DynamicAnnotationInputSchema,
    outputSchema: DynamicAnnotationOutputSchema,
  },
  async (input) => {
    // Call the prompt action directly.
    const result = await dynamicAnnotationPrompt(input, {
      model: 'vertexai/gemini-1.5-flash',
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    }) as any;

    const { output, response } = result;

    if (!output) {
      throw new Error('No output received from the model.');
    }

    // Try to find the image in the generated media parts
    const mediaPart = response.content?.find((p: any) => !!p.media);
    const annotatedImageDataUri = output.annotatedImageDataUri || mediaPart?.media?.url;
    
    if (!annotatedImageDataUri) {
      throw new Error('No annotated image data URI found in the model output.');
    }

    return {
      annotatedImageDataUri: annotatedImageDataUri,
      explanation: output.explanation || input.explanation,
    };
  }
);
