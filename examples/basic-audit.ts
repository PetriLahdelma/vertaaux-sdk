/**
 * Basic audit example
 *
 * Run: npx ts-node examples/basic-audit.ts
 */

import { VertaaUX } from '../src';

async function main() {
  // Initialize client
  const client = new VertaaUX({
    apiKey: process.env.VERTAAUX_API_KEY!,
  });

  // Create an audit
  console.log('Creating audit...');
  const audit = await client.audits.create({
    url: 'https://example.com',
    mode: 'standard',
  });

  console.log(`Audit created: ${audit.job_id}`);
  console.log(`Status: ${audit.status}`);

  // Poll for completion
  console.log('Waiting for completion...');
  let result = await client.audits.retrieve(audit.job_id);
  while (result.status === 'queued' || result.status === 'running') {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    result = await client.audits.retrieve(audit.job_id);
    console.log(`  Progress: ${result.progress}%`);
  }

  // Display results
  if (result.status === 'completed' && result.scores) {
    console.log('\n--- Results ---');
    console.log(`Overall score: ${result.scores.overall}/100`);
    console.log(`  UX: ${result.scores.ux}`);
    console.log(`  Accessibility: ${result.scores.accessibility}`);
    console.log(`  Information Architecture: ${result.scores.information_architecture}`);
    console.log(`  Performance: ${result.scores.performance}`);

    if (result.issues && result.issues.length > 0) {
      console.log(`\n--- Issues (${result.issues.length} total) ---`);
      result.issues.slice(0, 5).forEach((issue, i) => {
        console.log(`\n${i + 1}. [${issue.severity.toUpperCase()}] ${issue.category}`);
        console.log(`   ${issue.description}`);
        console.log(`   Fix: ${issue.recommendation}`);
      });
    }
  } else if (result.status === 'failed') {
    console.error(`Audit failed: ${result.error}`);
    process.exit(1);
  }
}

main().catch(console.error);
