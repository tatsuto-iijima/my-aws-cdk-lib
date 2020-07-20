# AWS Lambda Construct CDK Library

This library provides constructs for Lambda functions.

IAM Role, Lambda Version constructor can be provided together with option selection.

## Usage

### Construct Lambda Function

Define a Lambda Function:
```
new Lambda(this, "MyLambda", {
  func: {
    code: lambda.Code.fromAsset('code.zip'),
    handler: 'index',
    runtime: lambda.Runtime.NODEJS_12_X,
  },
});
```

All other properties of lambda.Function are supported, see also the [AWS Lambda construct library](https://docs.aws.amazon.com/cdk/api/latest/docs/@aws-cdk_aws-lambda.Function.html).

### Construct IAM Role

IAM Role used in Lambda can be defined together.

Define a IAM Role:
```
new Lambda(this, "MyLambda", {
  func: {
    code: lambda.Code.fromAsset('code.zip'),
    handler: 'index',
    runtime: lambda.Runtime.NODEJS_12_X,
  },
  role: {
    servicePrincipalNames: [
      'lambda.amazonaws.com',
      'edgelambda.amazonaws.com'
    ],
    description: 'Test Construct "Lambda"',
    managedPolicieNames: [
      'service-role/AWSLambdaBasicExecutionRole','AmazonS3ReadOnlyAccess',
    ],
  },
});
```

### Construct Lambda Version

A single newly-deployed version of a Lambda function.

Define a Lambda Version:
```
new Lambda(this, "MyLambda", {
  func: {
    code: lambda.Code.fromAsset('code.zip'),
    handler: 'index',
    runtime: lambda.Runtime.NODEJS_12_X,
  },
  version: {
    name: codeSha256,    // A unique name for this version.
    removalPolicy: cdk.RemovalPolicy.RETAIN,
  },
});
```
