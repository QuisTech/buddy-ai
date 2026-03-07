'use server';
/**
 * @fileOverview An AI agent that provides adaptive clarifications, simplifications, or analogies to students.
 *
 * - adaptiveClarification - A function that generates tailored explanations based on student confusion.
 * - AdaptiveClarificationInput - The input type for the adaptiveClarification function.
 * - AdaptiveClarificationOutput - The return type for the adaptiveClarification function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AdaptiveClarificationInputSchema = z.object({
  concept: z.string().describe('The core concept the student is currently studying.'),
  studentConfusion: z
    .string()
    .describe('The specific question, misunderstanding, or area of difficulty the student has expressed.'),
});
export type AdaptiveClarificationInput = z.infer<typeof AdaptiveClarificationInputSchema>;

const AdaptiveClarificationOutputSchema = z.object({
  clarificationType: z
    .enum(['alternative-explanation', 'simplification', 'analogy'])
    .describe(
      'The type of clarification provided: "alternative-explanation" for a different explanation, "simplification" for breaking down complex ideas, or "analogy" for a relatable comparison.'
    ),
  clarificationText: z.string().describe('The generated clarification for the student.'),
});
export type AdaptiveClarificationOutput = z.infer<typeof AdaptiveClarificationOutputSchema>;

export async function adaptiveClarification(
  input: AdaptiveClarificationInput
): Promise<AdaptiveClarificationOutput> {
  return adaptiveClarificationFlow(input);
}

const adaptiveClarificationPrompt = ai.definePrompt({
  name: 'adaptiveClarificationPrompt',
  input: {schema: AdaptiveClarificationInputSchema},
  output: {schema: AdaptiveClarificationOutputSchema},
  prompt: `You are an expert tutor dedicated to helping students understand complex concepts. Your goal is to provide clear, helpful, and concise explanations.

A student is currently confused about the concept: "{{{concept}}}".
Their specific confusion or question is: "{{{studentConfusion}}}".

Your task is to analyze the student's confusion and provide a tailored clarification. You must choose the most appropriate method among the following:
1.  **Alternative Explanation**: Rephrase or explain the concept from a different angle.
2.  **Simplification**: Break down complex ideas into simpler, more digestible parts.
3.  **Analogy**: Provide a relatable comparison to a more familiar concept.

Return your response in JSON format, indicating the 'clarificationType' you chose and the 'clarificationText'. Ensure the 'clarificationText' directly addresses the student's confusion using the chosen method.`,
});

const adaptiveClarificationFlow = ai.defineFlow(
  {
    name: 'adaptiveClarificationFlow',
    inputSchema: AdaptiveClarificationInputSchema,
    outputSchema: AdaptiveClarificationOutputSchema,
  },
  async input => {
    const {output} = await adaptiveClarificationPrompt(input);
    if (!output) {
      throw new Error('Failed to generate adaptive clarification.');
    }
    return output;
  }
);
