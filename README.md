# OB CDK Test

| Property               | Type          | Description                                                               | Required | Default                      |
|------------------------|---------------|---------------------------------------------------------------------------|----------|------------------------------|
| `eventName`            | `string`      | The name of the event to be used in Metaflow                              | Yes      | -                            |
| `metaflowConfigStr`    | `string`      | Configuration string for Metaflow in JSON format                          | Yes      | -                            |
| `existingBucket?`      | `IBucket`     | Optional existing bucket to use                                           | No       | A new bucket is created      |
| `bucketProps?`         | `BucketProps` | Optional bucket configuration when creating a new bucket                  | No       | Default bucket configuration |
| `prefix?`              | `string`      | Optional prefix filter for S3 notifications                               | No       | No prefix filter             |
| `suffix?`              | `string`      | Optional suffix filter for S3 notifications                               | No       | No suffix filter             |
| `crossAccountRoleArn?` | `string`      | Optional cross-account IAM role ARN that should have access to the bucket | No       | No cross-account access      |

## Usage Examples

```ts
// 1. Basic usage with required properties
new OBAwareBucketLambda(this, 'XXXXXXXXXXXXXX', {
    eventName: 'my-metaflow-event',
    metaflowConfigStr: JSON.stringify({
        // your metaflow configuration here
    })
});

// 2. Use existing bucket with cross-account access
new OBAwareBucketLambda(this, 'XXXXXXXXXXXXXXXXXXXXXXXX', {
    eventName: 'cross-account-event',
    metaflowConfigStr: JSON.stringify({
        // your metaflow configuration here
    }),
    existingBucket: s3.Bucket.fromBucketArn(
        this,
        'ImportedBucket',
        'arn:aws:s3:::existing-bucket'
    ),
    crossAccountRoleArn: 'arn:aws:iam::123456789012:role/cross-account-role'
});

// 3. Create new bucket with custom configuration and filters
new OBAwareBucketLambda(this, 'XXXXXXXXXXXXXXXXXX', {
    eventName: 'filtered-event',
    metaflowConfigStr: JSON.stringify({
        // your metaflow configuration here
    }),
    bucketProps: {
        versioned: true,
        encryption: s3.BucketEncryption.S3_MANAGED,
        removalPolicy: cdk.RemovalPolicy.DESTROY
    },
    prefix: 'uploads/',
    suffix: '.json'
});
