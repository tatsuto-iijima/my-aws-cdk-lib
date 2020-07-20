#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
const jsSHA = require('jssha');
import * as fs from 'fs';
import { Lambda } from '../lib/index';

const app = new cdk.App();
const stacks: cdk.Stack[] = [];
let testNum = 0;

const shaObj = new jsSHA("SHA-256", "TEXT", { encoding: "UTF8" });
shaObj.update(fs.readFileSync('./bin/code.zip').toString());
const codeSha256 = shaObj.getHash("HEX");

stacks.push(new cdk.Stack(app, "MyAwsCdkLibLambdaTestStack" + testNum));
new Lambda(stacks[testNum], "Lambda", {
  func: {
    code: lambda.Code.fromAsset('./bin/code.zip'),
    handler: 'index',
    runtime: lambda.Runtime.NODEJS_12_X,
  },
});
testNum++;

stacks.push(new cdk.Stack(app, "MyAwsCdkLibLambdaTestStack" + testNum));
new Lambda(stacks[testNum], "Lambda", {
  func: {
    code: lambda.Code.fromAsset('./bin/code.zip'),
    handler: 'index',
    runtime: lambda.Runtime.NODEJS_12_X,
  },
  role: {
    servicePrincipalNames: [ 'lambda.amazonaws.com', 'edgelambda.amazonaws.com' ],
    description: 'Test Construct "Lambda"' ,
    managedPolicieNames: [ 'service-role/AWSLambdaBasicExecutionRole', 'AmazonS3ReadOnlyAccess' ],
  },
  version: {
    name: codeSha256,
  },
});
testNum++;
