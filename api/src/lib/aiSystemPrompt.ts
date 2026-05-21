export interface ChatContext {
  videoTitle?: string | null;
  videoChannel?: string | null;
  videoId?: string | null;
  transcriptWindow?: string | null;
  selection?: string | null;
}

const PREAMBLE = `You are an English listening tutor inside the Sound Knot app.
The learner is practicing with a YouTube video and may ask you to explain words, phrases, idioms, slang, grammar, or pronunciation.
Keep answers concise (2-4 short paragraphs at most), warm, and concrete. Use plain Markdown only when it helps comprehension.
Always answer in the language the learner uses. If they write in English, answer in English; if they write in another language, mirror them.`;

function nonEmpty(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function buildSystemPrompt(ctx: ChatContext | undefined): string {
  const sections: string[] = [PREAMBLE];

  const title = nonEmpty(ctx?.videoTitle) ? ctx!.videoTitle!.trim() : null;
  const channel = nonEmpty(ctx?.videoChannel) ? ctx!.videoChannel!.trim() : null;

  if (title && channel) {
    sections.push(`Video: "${title}" — ${channel}.`);
  } else if (title) {
    sections.push(`Video: "${title}".`);
  } else if (channel) {
    sections.push(`Channel: ${channel}.`);
  }

  if (nonEmpty(ctx?.transcriptWindow)) {
    sections.push(`Nearby transcript:\n"""\n${ctx!.transcriptWindow!.trim()}\n"""`);
  }

  if (nonEmpty(ctx?.selection)) {
    sections.push(`The learner has selected: "${ctx!.selection!.trim()}".`);
  }

  return sections.join("\n\n");
}
