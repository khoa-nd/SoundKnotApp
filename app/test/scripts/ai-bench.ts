import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chat, type AiSettings, type AiMessage, type AiContext, type TranscriptLine } from '../../src/services/aiTutor';
import { estimateCost } from '../../src/services/playgroundRun';

// 1. Types & Configs
interface BenchVideo {
  id: string;
  title: string;
  channel: string;
  description: string;
  transcript: TranscriptLine[];
  comprehensionPrompt: string;
  vocabPrompt: string;
}

interface BenchmarkResult {
  videoId: string;
  promptType: string;
  promptText: string;
  reply: string;
  latencyMs: number;
  promptTokens: number;
  completionTokens: number;
  cost: number | null;
  formatCompliance: number; // 0 or 1
  coverage: number;          // 0 or 1
  error: string | null;
}

// 2. Command Line Arguments Parsing
const args = process.argv.slice(2);
let apiKey = process.env.GEMINI_API_KEY || '';
let provider: 'gemini' | 'openrouter' = 'gemini';
let model = 'gemini-3.5-flash';
let mode: 'direct' | 'proxy' = 'direct';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--key') apiKey = args[++i];
  if (args[i] === '--provider') provider = args[++i] as any;
  if (args[i] === '--model') model = args[++i];
  if (args[i] === '--proxy') mode = 'proxy';
}

if (mode === 'direct' && !apiKey) {
  console.error('Error: Provide GEMINI_API_KEY env or pass --key <KEY>');
  process.exit(1);
}

// 3. Helper evaluation heuristics
function evaluateSummary(reply: string): { formatCompliance: number; coverage: number } {
  // Check if bulleted and no timestamps
  const hasBullets = /^\s*[-*•+]\s/m.test(reply) || /^\s*\d+\.\s/m.test(reply);
  const hasTimestamps = /\[t=\d{1,2}:\d{2}\]|\d{1,2}:\d{2}/.test(reply);
  const formatCompliance = (hasBullets && !hasTimestamps) ? 1 : 0;

  // Since test transcript is short, check if we refer to content from multiple sections
  const words = reply.toLowerCase();
  const coverage = (words.length > 50) ? 1 : 0; // Quick heuristic for coverage
  return { formatCompliance, coverage };
}

function evaluateList(reply: string): { formatCompliance: number; coverage: number } {
  // Check format: **term** - meaning. Transcript: "..."
  const hasBoldTerm = /\*\*[^*]+\*\*\s*-\s*/.test(reply);
  const hasTranscriptQuote = /transcript/i.test(reply) || /"[^"]+"/.test(reply);
  const noFiller = !reply.startsWith('Sure') && !reply.startsWith('Here is');
  
  const formatCompliance = (hasBoldTerm && hasTranscriptQuote && noFiller) ? 1 : 0;
  const coverage = reply.length > 30 ? 1 : 0;
  return { formatCompliance, coverage };
}

function evaluateComprehension(reply: string): { formatCompliance: number; coverage: number } {
  // Must use literal token [t=MM:SS]
  const hasValidTimestampCitation = /\[t=\d{1,2}:\d{2}\]/.test(reply);
  const formatCompliance = hasValidTimestampCitation ? 1 : 0;
  const coverage = reply.length > 20 ? 1 : 0;
  return { formatCompliance, coverage };
}

// 4. Execution loop
async function run() {
  const resourcePath = join(__dirname, '../resources/bench-videos.json');
  const videos: BenchVideo[] = JSON.parse(readFileSync(resourcePath, 'utf8'));

  const settings: AiSettings = {
    mode,
    provider,
    model,
    apiKey,
  };

  const results: BenchmarkResult[] = [];

  for (const video of videos) {
    console.log(`\nEvaluating Video: ${video.title} (${video.id})`);

    // Create timestamp transcript format
    const fullTranscript = video.transcript
      .map(t => {
        const min = Math.floor(t.start / 60);
        const sec = Math.floor(t.start % 60);
        const timeStr = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
        return `${timeStr}  ${t.text}`;
      })
      .join('\n');

    // Build the transcript window around middle point (arbitrary center)
    const midPoint = video.transcript.length > 0 ? video.transcript[Math.floor(video.transcript.length / 2)].start : 0;
    const transcriptWindow = video.transcript.map(t => t.text).join(' ');

    const context: AiContext = {
      videoTitle: video.title,
      videoChannel: video.channel,
      videoId: video.id,
      fullTranscript,
      transcriptWindow,
    };

    const prompts = [
      { type: 'Summary', prompt: 'Summarize the video' },
      { type: 'Keywords', prompt: 'List of keywords' },
      { type: 'Phrases', prompt: 'List of grammars or phrases' },
      { type: 'Comprehension', prompt: video.comprehensionPrompt },
      { type: 'Vocabulary', prompt: video.vocabPrompt }
    ];

    for (const p of prompts) {
      console.log(`  Running prompt [${p.type}]: "${p.prompt}"`);
      const t0 = Date.now();
      
      let reply = '';
      let latencyMs = 0;
      let promptTokens = 0;
      let completionTokens = 0;
      let cost: number | null = null;
      let formatCompliance = 0;
      let coverage = 0;
      let errorStr: string | null = null;

      try {
        const msg: AiMessage = { role: 'user', content: p.prompt };
        const response = await chat({
          messages: [msg],
          context,
          settings,
        });

        latencyMs = Date.now() - t0;
        reply = response.reply;
        promptTokens = response.usage?.promptTokens ?? 0;
        completionTokens = response.usage?.completionTokens ?? 0;
        
        const usageObj = { promptTokens, completionTokens };
        cost = estimateCost(provider, model, usageObj, null);

        // Evaluate Heuristics
        if (p.type === 'Summary') {
          const evalRes = evaluateSummary(reply);
          formatCompliance = evalRes.formatCompliance;
          coverage = evalRes.coverage;
        } else if (p.type === 'Keywords' || p.type === 'Phrases') {
          const evalRes = evaluateList(reply);
          formatCompliance = evalRes.formatCompliance;
          coverage = evalRes.coverage;
        } else {
          const evalRes = evaluateComprehension(reply);
          formatCompliance = evalRes.formatCompliance;
          coverage = evalRes.coverage;
        }

      } catch (err: any) {
        latencyMs = Date.now() - t0;
        errorStr = err?.message || String(err);
        console.error(`    Error: ${errorStr}`);
      }

      results.push({
        videoId: video.id,
        promptType: p.type,
        promptText: p.prompt,
        reply: reply.replace(/"/g, '""').replace(/\n/g, ' '), // sanitize for CSV
        latencyMs,
        promptTokens,
        completionTokens,
        cost,
        formatCompliance,
        coverage,
        error: errorStr
      });
    }
  }

  // Write CSV Output
  const dateStr = new Date().toISOString().split('T')[0];
  const csvDir = join(__dirname, '../resources/benchmarks');
  mkdirSync(csvDir, { recursive: true });
  const csvFile = join(csvDir, `${dateStr}-${model}.csv`);

  const headers = 'videoId,promptType,promptText,reply,latencyMs,promptTokens,completionTokens,cost,formatCompliance,coverage,error\n';
  const csvRows = results.map(r => 
    `"${r.videoId}","${r.promptType}","${r.promptText}","${r.reply}",${r.latencyMs},${r.promptTokens},${r.completionTokens},${r.cost},${r.formatCompliance},${r.coverage},"${r.error || ''}"`
  ).join('\n');

  writeFileSync(csvFile, headers + csvRows, 'utf8');
  console.log(`\nCSV results written to: ${csvFile}`);

  // Write MD Summary
  const totalRequests = results.length;
  const errorCount = results.filter(r => r.error).length;
  const avgLatency = results.reduce((acc, r) => acc + r.latencyMs, 0) / totalRequests;
  const totalCost = results.reduce((acc, r) => acc + (r.cost || 0), 0);
  const avgFormat = results.reduce((acc, r) => acc + r.formatCompliance, 0) / totalRequests;
  const avgCoverage = results.reduce((acc, r) => acc + r.coverage, 0) / totalRequests;

  const mdReportFile = join(__dirname, `../../../docs/specs/${dateStr}-${model}-report.md`);
  const mdContent = `# Benchmark Report: ${model} (${dateStr})

## Overall Performance Metrics
- **Total test cases:** ${totalRequests}
- **Failure / Error rate:** ${((errorCount / totalRequests) * 100).toFixed(1)}% (${errorCount}/${totalRequests})
- **Average Latency:** ${avgLatency.toFixed(0)}ms
- **Total Cost:** $${totalCost.toFixed(6)}
- **Average Format Compliance:** ${(avgFormat * 100).toFixed(1)}%
- **Average Coverage:** ${(avgCoverage * 100).toFixed(1)}%

## Recommendations / Details
Candidate model **${model}** evaluated across 5 canonical videos with 5 prompts each.

- CSV detail logged at: \`app/test/resources/benchmarks/${dateStr}-${model}.csv\`
`;

  writeFileSync(mdReportFile, mdContent, 'utf8');
  console.log(`Markdown summary report written to: ${mdReportFile}`);
}

run().catch(err => {
  console.error('Benchmark script crashed:', err);
  process.exit(1);
});
