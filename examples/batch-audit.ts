/**
 * Batch audit example
 *
 * Audit multiple URLs in parallel
 *
 * Run: npx ts-node examples/batch-audit.ts
 */

import { VertaaUX, Audit } from '../src';

const URLS_TO_AUDIT = [
  'https://example.com',
  'https://example.com/about',
  'https://example.com/contact',
  'https://example.com/products',
];

async function batchAudit(urls: string[]): Promise<void> {
  const client = new VertaaUX({
    apiKey: process.env.VERTAAUX_API_KEY!,
  });

  console.log(`🚀 Starting batch audit of ${urls.length} URLs\n`);

  // Create all audits in parallel
  const auditPromises = urls.map(async (url) => {
    console.log(`  Creating audit for: ${url}`);
    return client.audits.create({ url });
  });

  const audits = await Promise.all(auditPromises);
  console.log(`\n✅ Created ${audits.length} audits\n`);

  // Wait for all to complete
  console.log('⏳ Waiting for completion...\n');

  const results = await Promise.all(
    audits.map((audit) =>
      client.audits.waitForCompletion(audit.id).catch((error) => ({
        ...audit,
        status: 'failed' as const,
        error: error.message,
      }))
    )
  );

  // Summary table
  console.log('📊 Results Summary\n');
  console.log('URL'.padEnd(40) + 'Score'.padEnd(8) + 'Issues'.padEnd(10) + 'Critical');
  console.log('-'.repeat(70));

  let totalScore = 0;
  let totalIssues = 0;
  let totalCritical = 0;

  results.forEach((result: Audit) => {
    const url = result.url.replace(/^https?:\/\//, '').slice(0, 38);
    const score = result.summary?.score ?? '-';
    const issues = result.summary?.issues ?? '-';
    const critical = result.summary?.critical ?? '-';

    console.log(
      url.padEnd(40) +
        String(score).padEnd(8) +
        String(issues).padEnd(10) +
        String(critical)
    );

    if (result.summary) {
      totalScore += result.summary.score;
      totalIssues += result.summary.issues;
      totalCritical += result.summary.critical;
    }
  });

  console.log('-'.repeat(70));
  console.log(
    'AVERAGE'.padEnd(40) +
      String(Math.round(totalScore / results.length)).padEnd(8) +
      String(totalIssues).padEnd(10) +
      String(totalCritical)
  );

  console.log('\n📁 Individual reports:');
  results.forEach((result) => {
    console.log(`  https://app.vertaaux.ai/audits/${result.id}`);
  });
}

batchAudit(URLS_TO_AUDIT).catch(console.error);
