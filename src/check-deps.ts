import { execSync } from 'child_process';

interface Dependency {
  name: string;
  command: string;
  installHint: string;
}

const dependencies: Dependency[] = [
  {
    name: 'yt-dlp',
    command: 'yt-dlp --version',
    installHint: 'pipx install yt-dlp',
  },
  {
    name: 'deno',
    command: 'deno --version',
    installHint: 'curl -fsSL https://deno.land/install.sh | sh',
  },
  {
    name: 'ffmpeg',
    command: 'ffmpeg -version',
    installHint: 'sudo apt install ffmpeg',
  },
  {
    name: 'yoto-cli',
    command: `${process.env.HOME}/.local/bin/yoto --version`,
    installHint: 'curl -fsSL https://raw.githubusercontent.com/TheBestMoshe/yoto-cli/main/install.sh | bash',
  },
];

function checkDependency(dep: Dependency): boolean {
  try {
    execSync(dep.command, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function main() {
  console.log('Checking dependencies...\n');

  let allGood = true;
  const missing: Dependency[] = [];

  for (const dep of dependencies) {
    const found = checkDependency(dep);
    const status = found ? '✓' : '✗';
    console.log(`  ${status} ${dep.name}`);

    if (!found) {
      allGood = false;
      missing.push(dep);
    }
  }

  console.log('');

  if (allGood) {
    console.log('All dependencies installed!');
  } else {
    console.log('Missing dependencies:\n');
    for (const dep of missing) {
      console.log(`  ${dep.name}:`);
      console.log(`    ${dep.installHint}\n`);
    }
    process.exit(1);
  }
}

main();
