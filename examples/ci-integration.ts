/**
 * CI/CD integration example
 *
 * Fails the build if critical accessibility issues are found
 * or if the score is below a threshold.
 *
 * Run: npx ts-node examples/ci-integration.ts https://your-preview-url.com
 */

import { VertaaUX, VertaaUXError } from '../src';

interface CIOptions {
  url: string;
  minScore?: number;
  failOnCritical?: boolean;
  maxIssues?: number;
}

async function runCIAudit(options: CIOptions): Promise<void> {
  const { url, minScore = 80, failOnCritical = true, maxIssues } = options;

  const client = new VertaaUX({
    apiKey: process.env.VERTAAUX_API_KEY!,
  });

  console.log(`🔍 Auditing: ${url}`);
  console.log(`   Min score: ${minScore}`);
  console.log(`   Fail on critical: ${failOnCritical}`);
  if (maxIssues) console.log(`   Max issues: ${maxIssues}`);
  console.log('');

  // Create and wait for audit
  const audit = await client.audits.create({ url });
  const result = await client.audits.waitForCompletion(audit.id, {
    timeout: 120000, // 2 minutes for CI
  });

  if (result.status === 'failed') {
    console.error(`❌ Audit failed: ${result.error}`);
    process.exit(1);
  }

  const { summary } = result;
  if (!summary) {
    console.error('❌ No summary available');
    process.exit(1);
  }

  // Display results
  console.log('📊 Results:');
  console.log(`   Score: ${summary.score}/100`);
  console.log(`   Issues: ${summary.issues} total`);
  console.log(`   Critical: ${summary.critical}`);
  console.log('');

  // Check thresholds
  const failures: string[] = [];

  if (summary.score < minScore) {
    failures.push(`Score ${summary.score} is below minimum ${minScore}`);
  }

  if (failOnCritical && summary.critical > 0) {
    failures.push(`Found ${summary.critical} critical issue(s)`);
  }

  if (maxIssues && summary.issues > maxIssues) {
    failures.push(`Found ${summary.issues} issues, max allowed is ${maxIssues}`);
  }

  if (failures.length > 0) {
    console.error('❌ Accessibility check failed:');
    failures.forEach((f) => console.error(`   - ${f}`));
    console.log('');
    console.log(`🔗 Full report: https://app.vertaaux.ai/audits/${audit.id}`);
    process.exit(1);
  }

  console.log('✅ Accessibility check passed!');
  console.log(`🔗 Full report: https://app.vertaaux.ai/audits/${audit.id}`);
}

// Parse CLI arguments
const url = process.argv[2];
if (!url) {
  console.error('Usage: npx ts-node examples/ci-integration.ts <url>');
  process.exit(1);
}

runCIAudit({
  url,
  minScore: parseInt(process.env.MIN_SCORE || '80', 10),
  failOnCritical: process.env.FAIL_ON_CRITICAL !== 'false',
}).catch((error) => {
  if (error instanceof VertaaUXError) {
    console.error(`❌ ${error.name}: ${error.message}`);
  } else {
    console.error('❌ Unexpected error:', error);
  }
  process.exit(1);
});
