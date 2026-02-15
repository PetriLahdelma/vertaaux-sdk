/**
 * Batch audit example
 *
 * Audit multiple URLs in parallel
 *
 * Run: npx ts-node examples/batch-audit.ts
 */

import { VertaaUX, type Audit } from '../src';

const URLS_TO_AUDIT = [
  'https://example.com',
  'https://example.com/about',
  'https://example.com/contact',
  'https://example.com/products',
];

async function pollUntilDone(
  client: VertaaUX,
  jobId: string,
  timeoutMs: number = 300000
): Promise<Audit> {
  const startTime = Date.now();
  let result = await client.audits.retrieve(jobId);
  while (result.status === 'queued' || result.status === 'running') {
    if (Date.now() - startTime > timeoutMs) {
      throw new Error(`Audit ${jobId} timed out after ${timeoutMs / 1000}s`);
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
    result = await client.audits.retrieve(jobId);
  }
  return result;
}

async function batchAudit(urls: string[]): Promise<void> {
  const client = new VertaaUX({
    apiKey: process.env.VERTAAUX_API_KEY!,
  });

  console.log(`Starting batch audit of ${urls.length} URLs\n`);

  // Create all audits in parallel
  const auditPromises = urls.map(async (url) => {
    console.log(`  Creating audit for: ${url}`);
    return client.audits.create({ url });
  });

  const audits = await Promise.all(auditPromises);
  console.log(`\nCreated ${audits.length} audits\n`);

  // Poll all audits until complete
  console.log('Waiting for completion...\n');

  const results = await Promise.all(
    audits.map((audit) =>
      pollUntilDone(client, audit.job_id).catch((error) => ({
        ...audit,
        status: 'failed' as const,
        error: error.message,
      }))
    )
  );

  // Summary table
  console.log('Results Summary\n');
  console.log(
    'URL'.padEnd(40) + 'Score'.padEnd(8) + 'Issues'.padEnd(10) + 'Status'
  );
  console.log('-'.repeat(70));

  let totalScore = 0;
  let scoredCount = 0;
  let totalIssues = 0;

  results.forEach((result: Audit) => {
    const url = (result.url ?? '').replace(/^https?:\/\//, '').slice(0, 38);
    const score = result.scores?.overall ?? '-';
    const issues = result.issues?.length ?? '-';
    const status = result.status;

    console.log(
      url.padEnd(40) +
        String(score).padEnd(8) +
        String(issues).padEnd(10) +
        status
    );

    if (result.scores?.overall !== undefined) {
      totalScore += result.scores.overall;
      scoredCount++;
    }
    if (result.issues) {
      totalIssues += result.issues.length;
    }
  });

  console.log('-'.repeat(70));
  const avgScore = scoredCount > 0 ? Math.round(totalScore / scoredCount) : '-';
  console.log(
    'AVERAGE'.padEnd(40) +
      String(avgScore).padEnd(8) +
      String(totalIssues).padEnd(10) +
      ''
  );

  console.log('\nIndividual reports:');
  results.forEach((result) => {
    console.log(`  https://app.vertaaux.ai/audits/${result.job_id}`);
  });
}

batchAudit(URLS_TO_AUDIT).catch(console.error);
