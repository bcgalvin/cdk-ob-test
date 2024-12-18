import { ArnPrincipal, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Function, FunctionProps, IFunction } from 'aws-cdk-lib/aws-lambda';
import { Bucket, BucketProps, EventType, IBucket, NotificationKeyFilter } from 'aws-cdk-lib/aws-s3';
import { LambdaDestination } from 'aws-cdk-lib/aws-s3-notifications';

import { Construct } from 'constructs';

export interface OBAwareBucketLambdaProps {
  /**
   * Optional existing bucket to use. If not provided, a new bucket will be created.
   * @default - A new bucket is created
   */
  readonly existingBucket?: IBucket;

  /**
   * Optional bucket props to override defaults when creating a new bucket
   * @default - Default bucket configuration is used
   */
  readonly bucketProps?: BucketProps;

  /**
   * Either provide an existing Lambda function or props to create a new one.
   * If existingLambda is provided, lambdaProps will be ignored.
   */
  readonly existingLambda?: IFunction;

  /**
   * Props for creating a new Lambda function. Ignored if existingLambda is provided.
   * Required if existingLambda is not provided.
   */
  readonly lambdaProps?: FunctionProps;

  /**
   * Optional prefix filter for S3 notifications
   * @default - No prefix filter
   */
  readonly prefix?: string;

  /**
   * Optional suffix filter for S3 notifications
   * @default - No suffix filter
   */
  readonly suffix?: string;

  /**
   * Optional cross-account IAM role ARN that should have access to the bucket
   * @default - No cross-account access is configured
   */
  readonly crossAccountRoleArn?: string;
}

/**
 * A CDK construct that creates or imports an S3 bucket and associates it with a Lambda
 * function that is triggered when objects are created in the bucket.
 */
export class OBAwareBucketLambda extends Construct {
  public readonly bucket: IBucket;
  public readonly handler: Function;

  constructor(scope: Construct, id: string, props: OBAwareBucketLambdaProps) {
    super(scope, id);

    // Existing bucket creation/import logic
    this.bucket =
      props.existingBucket ??
      new Bucket(this, 's3-lambda-bucket', {
        ...props.bucketProps,
      });

    // Create the Lambda function
    this.handler = new Function(this, 'Handler', props.lambdaProps);

    // Grant the Lambda function permissions to read from the bucket
    this.bucket.grantRead(this.handler);

    // Add cross-account access if role ARN is provided
    if (props.crossAccountRoleArn) {
      this.bucket.addToResourcePolicy(
        new PolicyStatement({
          actions: ['s3:PutObject', 's3:GetObject', 's3:ListBucket'],
          principals: [new ArnPrincipal(props.crossAccountRoleArn)],
          resources: [this.bucket.arnForObjects('*'), this.bucket.bucketArn],
        }),
      );
    }

    // Add the notification configuration
    const filters: NotificationKeyFilter = {
      ...(props.prefix && { prefix: props.prefix }),
      ...(props.suffix && { suffix: props.suffix }),
    };

    this.bucket.addEventNotification(EventType.OBJECT_CREATED, new LambdaDestination(this.handler), filters);
  }
}
