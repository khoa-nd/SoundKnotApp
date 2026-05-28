// ── Sound Knot V2 — Vocabulary composer
// Calls the AI tutor service to format a single word/phrase into a
// structured vocabulary entry the Recall screen can render:
//   <<vocabulary>>  <<pronunciation>>  <<adj/noun/verb/adv>>
//   <<explanation>>
//   <<example sentence>>

import { chat, type AiContext, type AiSettings } from './aiTutor';

const VOCAB_PROMPT = [
  'You are a vocabulary card composer. Compose exactly ONE vocabulary card for the word/phrase below.',
  '',
  'Return ONLY 3 lines, no headings, no list, no intro, no outro. Use this exact format:',
  '',
  '**word or phrase** /IPA pronunciation/ (part of speech)',
  'short clear explanation in 1 sentence, learner-friendly.',
  'Example: "a natural example sentence in real spoken English."',
  '',
  'Rules:',
  '- The first line must contain ONLY the bolded headword, the IPA pronunciation between forward slashes, and the part of speech in parentheses (e.g. noun, verb, adjective, adverb, phrase).',
  '- The second line is the explanation only — do not prefix with "Explanation:".',
  '- The third line starts with `Example:` followed by ONE example sentence in double quotes.',
  '- Mirror the learner language used in the surrounding transcript when possible, otherwise English.',
  '- If the input contains multiple words but is a recognizable phrase or collocation, treat it as a single phrase.',
].join('\n');

export async function composeVocabulary(
  word: string,
  settings: AiSettings,
  context: AiContext = {},
): Promise<string> {
  const trimmed = word.trim();
  if (!trimmed) throw new Error('No word selected');
  const res = await chat({
    messages: [
      {
        role: 'user',
        content: `${VOCAB_PROMPT}\n\nWord/phrase: "${trimmed}"`,
      },
    ],
    context,
    settings,
  });
  return res.reply.trim();
}

export function buildVocabularyPrompt(word: string): string {
  return `${VOCAB_PROMPT}\n\nWord/phrase: "${word.trim()}"`;
}
