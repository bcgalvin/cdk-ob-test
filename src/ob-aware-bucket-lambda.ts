import * as path from 'path';
import { Duration } from 'aws-cdk-lib';
import { ArnPrincipal, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Architecture, Code, Function, Runtime, RuntimeFamily } from 'aws-cdk-lib/aws-lambda';
import { Bucket, BucketProps, EventType, IBucket, NotificationKeyFilter } from 'aws-cdk-lib/aws-s3';
import { LambdaDestination } from 'aws-cdk-lib/aws-s3-notifications';
import { LambdaPowertoolsLayer } from 'cdk-aws-lambda-powertools-layer';

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
   * The name of the event to be used in Metaflow
   * @default - none, must be provided
   */
  readonly eventName: string;

  /**
   * Configuration string for Metaflow in JSON format
   * @default - none, must be provided
   */
  readonly metaflowConfigStr: string;

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

    const powertoolsLayer = new LambdaPowertoolsLayer(this, 'powertoolsLayer', {
      includeExtras: true,
      runtimeFamily: RuntimeFamily.PYTHON,
    });

    this.bucket =
      props.existingBucket ??
      new Bucket(this, 's3-lambda-bucket', {
        ...props.bucketProps,
      });

    this.handler = new Function(this, 'Handler', {
      description: 'Trigger Metaflow runs with ArgoEvent()',
      architecture: Architecture.X86_64,
      runtime: Runtime.PYTHON_3_12,
      code: Code.fromAsset(path.join(__dirname, '../src/lambda')),
      handler: 'event_publisher.handler',
      timeout: Duration.seconds(30),
      layers: [powertoolsLayer],
      memorySize: 256,
      environment: {
        METAFLOW_EVENT_NAME: props.eventName,
        METAFLOW_CONFIG_STR: props.metaflowConfigStr,
        BUCKET_NAME: this.bucket.bucketName,
      },
    });

    this.bucket.grantRead(this.handler);

    if (props.crossAccountRoleArn) {
      this.bucket.addToResourcePolicy(
        new PolicyStatement({
          actions: ['s3:PutObject', 's3:GetObject', 's3:ListBucket'],
          principals: [new ArnPrincipal(props.crossAccountRoleArn)],
          resources: [this.bucket.arnForObjects('*'), this.bucket.bucketArn],
        }),
      );
    }

    const filters: NotificationKeyFilter = {
      ...(props.prefix && { prefix: props.prefix }),
      ...(props.suffix && { suffix: props.suffix }),
    };

    this.bucket.addEventNotification(EventType.OBJECT_CREATED, new LambdaDestination(this.handler), filters);
  }
}
