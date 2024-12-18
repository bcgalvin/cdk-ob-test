# OB CDK Test

```ts
// 1. Create new Lambda and new bucket
new S3LambdaObjectCreated(this, 'NewResources', {
    lambdaProps: {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromAsset('lambda')
    }
});

// 2. Use existing Lambda with new bucket
new S3LambdaObjectCreated(this, 'ExistingLambda', {
    existingLambda: lambda.Function.fromFunctionArn(
        this,
        'ImportedLambda',
        'arn:aws:lambda:region:account:function:existing-function'
    )
});

// 3. Use both existing Lambda and existing bucket
new S3LambdaObjectCreated(this, 'ExistingResources', {
    existingLambda: lambda.Function.fromFunctionArn(
        this,
        'ImportedLambda',
        'arn:aws:lambda:region:account:function:existing-function'
    ),
    existingBucket: s3.Bucket.fromBucketArn(
        this,
        'ImportedBucket',
        'arn:aws:s3:::existing-bucket'
    )
});

```