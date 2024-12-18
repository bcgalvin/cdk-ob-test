import { App, Stack } from 'aws-cdk-lib';

import { OBAwareBucketLambda } from '../src/index';

export class IntegTesting {
  readonly stack: Stack[];

  constructor() {
    const app = new App();

    const stack = new Stack(app, 'integration-stack');

    new OBAwareBucketLambda(stack, 'S3LambdaObjectCreated', {
      crossAccountRoleArn: 'arn:aws:iam::590183801547:role/obp-iquod5-task',
    });

    this.stack = [stack];
  }
}

new IntegTesting();
