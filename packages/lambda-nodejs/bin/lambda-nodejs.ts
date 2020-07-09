#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { LambdaNodejs } from '../lib/index';

const app = new cdk.App();
const stacks: cdk.Stack[] = [];
let testNum = 0;

stacks.push(new cdk.Stack(app, "MyAwsCdkLibLambdaNodejsTestStack" + testNum));
new LambdaNodejs(stacks[testNum], "LambdaNodejs");
testNum++;

stacks.push(new cdk.Stack(app, "MyAwsCdkLibLambdaNodejsTestStack" + testNum));
new LambdaNodejs(stacks[testNum], "LambdaNodejs", {
  role: {
    description: "for MyAwsCdkLibLambdaNodejsTestStack" + testNum,
    managedPolicies: [
      "service-role/AWSLambdaBasicExecutionRole",
      "AmazonS3ReadOnlyAccess"
    ],
  },
  version: {
    removalPolicy: cdk.RemovalPolicy.DESTROY,
  },
});
testNum++;

stacks.push(new cdk.Stack(app, "MyAwsCdkLibLambdaNodejsTestStack" + testNum));
new LambdaNodejs(stacks[testNum], "LambdaNodejs", {
  func: {
    entry: './lambda/test/index.ts',
    handler: 'handler',
  },
  role: {
    description: "for MyAwsCdkLibLambdaNodejsTestStack" + testNum,
    managedPolicies: [
      "service-role/AWSLambdaBasicExecutionRole",
      "AmazonS3ReadOnlyAccess"
    ],
  },
  version: {
    removalPolicy: cdk.RemovalPolicy.RETAIN,
  },
});
testNum++;
