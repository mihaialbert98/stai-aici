import { execSync } from 'child_process';

process.env.DATABASE_URL = 'postgresql://neondb_owner:npg_iswZhc2xY7Ty@ep-broad-cherry-ag463gtz-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require';

console.log('Running prisma migrate deploy against production...');
try {
  const output = execSync('npx prisma migrate deploy', {
    env: { ...process.env },
    encoding: 'utf-8',
    stdio: 'pipe',
  });
  console.log(output);
} catch (err: any) {
  console.error('STDERR:', err.stderr);
  console.log('STDOUT:', err.stdout);
}
