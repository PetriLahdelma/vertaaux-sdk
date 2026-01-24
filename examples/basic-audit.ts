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
    checks: ['wcag-aa', 'color-contrast', 'keyboard-nav'],
  });

  console.log(`Audit created: ${audit.id}`);
  console.log(`Status: ${audit.status}`);

  // Wait for completion
  console.log('Waiting for completion...');
  const completed = await client.audits.waitForCompletion(audit.id);

  // Display results
  if (completed.status === 'completed' && completed.summary) {
    console.log('\n--- Results ---');
    console.log(`Score: ${completed.summary.score}/100`);
    console.log(`Total issues: ${completed.summary.issues}`);
    console.log(`  Critical: ${completed.summary.critical}`);
    console.log(`  Serious: ${completed.summary.serious}`);
    console.log(`  Moderate: ${completed.summary.moderate}`);
    console.log(`  Minor: ${completed.summary.minor}`);

    if (completed.issues && completed.issues.length > 0) {
      console.log('\n--- Top Issues ---');
      completed.issues.slice(0, 5).forEach((issue, i) => {
        console.log(`\n${i + 1}. [${issue.severity.toUpperCase()}] ${issue.rule}`);
        console.log(`   ${issue.description}`);
        if (issue.aiSuggestion) {
          console.log(`   Fix: ${issue.aiSuggestion}`);
        }
      });
    }
  } else if (completed.status === 'failed') {
    console.error(`Audit failed: ${completed.error}`);
    process.exit(1);
  }
}

main().catch(console.error);
