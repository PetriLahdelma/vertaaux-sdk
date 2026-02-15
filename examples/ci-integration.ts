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
  failOnError?: boolean;
  maxIssues?: number;
}

async function runCIAudit(options: CIOptions): Promise<void> {
  const { url, minScore = 80, failOnError = true, maxIssues } = options;

  const client = new VertaaUX({
    apiKey: process.env.VERTAAUX_API_KEY!,
  });

  console.log(`Auditing: ${url}`);
  console.log(`  Min score: ${minScore}`);
  console.log(`  Fail on error-severity issues: ${failOnError}`);
  if (maxIssues) console.log(`  Max issues: ${maxIssues}`);
  console.log('');

  // Create audit
  const audit = await client.audits.create({ url, mode: 'standard' });

  // Poll for completion with timeout
  const timeoutMs = 120000; // 2 minutes for CI
  const startTime = Date.now();

  let result = await client.audits.retrieve(audit.job_id);
  while (result.status === 'queued' || result.status === 'running') {
    if (Date.now() - startTime > timeoutMs) {
      console.error('Audit timed out after 2 minutes');
      process.exit(1);
    }
    await new Promise((resolve) => setTimeout(resolve, 3000));
    result = await client.audits.retrieve(audit.job_id);
  }

  if (result.status === 'failed') {
    console.error(`Audit failed: ${result.error}`);
    process.exit(1);
  }

  const { scores, issues } = result;
  if (!scores) {
    console.error('No scores available');
    process.exit(1);
  }

  // Display results
  console.log('Results:');
  console.log(`  Overall score: ${scores.overall}/100`);
  console.log(`  Issues: ${issues?.length ?? 0} total`);

  const errorCount = issues?.filter((i) => i.severity === 'error').length ?? 0;
  console.log(`  Error-severity: ${errorCount}`);
  console.log('');

  // Check thresholds
  const failures: string[] = [];

  if (scores.overall !== undefined && scores.overall < minScore) {
    failures.push(`Score ${scores.overall} is below minimum ${minScore}`);
  }

  if (failOnError && errorCount > 0) {
    failures.push(`Found ${errorCount} error-severity issue(s)`);
  }

  if (maxIssues && issues && issues.length > maxIssues) {
    failures.push(
      `Found ${issues.length} issues, max allowed is ${maxIssues}`
    );
  }

  if (failures.length > 0) {
    console.error('Accessibility check failed:');
    failures.forEach((f) => console.error(`  - ${f}`));
    console.log('');
    console.log(
      `Full report: https://app.vertaaux.ai/audits/${audit.job_id}`
    );
    process.exit(1);
  }

  console.log('Accessibility check passed!');
  console.log(
    `Full report: https://app.vertaaux.ai/audits/${audit.job_id}`
  );
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
  failOnError: process.env.FAIL_ON_ERROR !== 'false',
}).catch((error) => {
  if (error instanceof VertaaUXError) {
    console.error(`${error.name}: ${error.message}`);
  } else {
    console.error('Unexpected error:', error);
  }
  process.exit(1);
});
