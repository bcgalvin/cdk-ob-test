import { awscdk, javascript } from 'projen';
import { ArrowParens } from 'projen/lib/javascript';

const cdkVersion = '2.173.2';
const peerDeps = [`@aws-cdk/aws-lambda-python-alpha@${cdkVersion}-alpha.0`, 'cdk-nag'];

const devDeps = [
  `@aws-cdk/integ-tests-alpha@${cdkVersion}-alpha.0`,
  `@aws-cdk/aws-lambda-python-alpha@${cdkVersion}-alpha.0`,
  'cdk-nag',
];

const deps = ['cdk-aws-lambda-powertools-layer'];

const project = new awscdk.AwsCdkConstructLibrary({
  author: 'Eddie Mattia',
  authorAddress: 'eddie@outerbounds.com',
  cdkVersion: cdkVersion,
  defaultReleaseBranch: 'main',
  jsiiVersion: '~5.5.0',
  name: 'cdk-ob-test',
  projenrcTs: true,
  repositoryUrl: 'https://github.com/emattia/cdk-mf.git',
  packageManager: javascript.NodePackageManager.PNPM,
  deps: deps,
  peerDeps: peerDeps,
  devDeps: devDeps,
  experimentalIntegRunner: true,
  eslintOptions: {
    dirs: ['src', 'test'],
    prettier: true,
  },
  prettier: true,
  prettierOptions: {
    settings: {
      singleQuote: true,
      printWidth: 120,
      arrowParens: ArrowParens.AVOID,
    },
  },
  githubOptions: {
    workflows: false
  },
  release:false,
  gitignore: ['cdk.out', '.idea/', 'animations/media', '**/__pycache__'],
});


project.synth();
