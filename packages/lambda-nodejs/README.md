# AWS Lambda Node.js Construct CDK Library

This library provides constructs for Node.js Lambda functions.

To use this module, you will need to have Docker installed.

## Usage

### Construct Node.js Function

Define a NodejsFunction:
```
new LambdaNodejs(this, "my-handler");
```

By default, the construct will use the name of the defining file and the construct's id to look up the entry file:
```
.
├── stack.ts # defines a 'NodejsFunction' with 'my-handler' as id
├── stack.my-handler.ts # exports a function named 'handler'
```
This file is used as "entry" for Parcel. This means that your code is automatically transpiled and bundled whether it's written in JavaScript or TypeScript.

Alternatively, an entry file and handler can be specified:
```
new LambdaNodejs(this, 'MyFunction', {
  func: {
    entry: '/path/to/my/file.ts', // accepts .js, .jsx, .ts and .tsx files
    handler: 'myExportedFunc'
  }
});
```

All other properties of lambda-nodejs.NodejsFunction are supported, see also the [AWS Lambda construct library](https://docs.aws.amazon.com/cdk/api/latest/docs/@aws-cdk_aws-lambda-nodejs.NodejsFunction.html).

### Construct Lambda Version

A single newly-deployed version of a Lambda function.

Define a Lambda Version:
```
new LambdaNodejs(this, "MyFunction", {
  func: {
    entry: './lambda/test/index.ts',
    handler: 'handler',
  },
  version: {
    removalPolicy: cdk.RemovalPolicy.RETAIN,
  },
});

```

### Construct IAM Role

IAM Role used in Lambda can be defined together.

Define a IAM Role:
```
new LambdaNodejs(this, "MyFunction", {
  role: {
    description: "for MyFunction",
    managedPolicies: [
      "service-role/AWSLambdaBasicExecutionRole",
      "AmazonS3ReadOnlyAccess"
    ],
  },
  version: {
    removalPolicy: cdk.RemovalPolicy.RETAIN,
  },
});
```
