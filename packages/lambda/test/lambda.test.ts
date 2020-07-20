import { expect as expectCDK, countResources, ABSENT, arrayWith, objectLike, haveResourceLike, SynthUtils } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
const jsSHA = require('jssha');
import * as fs from 'fs';
import * as AwsCdkLibLambda from '../lib/index';

const shaObj = new jsSHA("SHA-256", "TEXT", { encoding: "UTF8" });
shaObj.update(fs.readFileSync('./test/sample/code.zip').toString());
const codeSha256 = shaObj.getHash("HEX");

describe('Test Construct "Lambda" by default', () => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, "TestStack");
  new AwsCdkLibLambda.Lambda(stack, 'MyTestConstruct', {
    func: {
      code: lambda.Code.fromAsset('./test/sample/code.zip'),
      handler: 'index',
      runtime: lambda.Runtime.NODEJS_12_X,
    },
  });

  test('Lambda Function x1 Created', () => {
    expectCDK(stack).to(countResources("AWS::Lambda::Function", 1));
  });

  test('IAM Role x1 Created', () => {
    expectCDK(stack).to(countResources("AWS::IAM::Role", 1));
  });

  test('IAM Role Property "AssumeRolePolicyDocument" has "lambda.amazonaws.com"', () => {
    expectCDK(stack).to(haveResourceLike("AWS::IAM::Role", {
      AssumeRolePolicyDocument: {
        Statement: arrayWith(
          objectLike({
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
              Service: "lambda.amazonaws.com",
            },
          }),
        ),
      },
    }));
  });

  test('IAM Role Property "ManagedPolicyArns" has "AWSLambdaBasicExecutionRole"', () => {
    expectCDK(stack).to(haveResourceLike("AWS::IAM::Role", {
      ManagedPolicyArns: arrayWith(objectLike({
        "Fn::Join": [
          "",
          [
            "arn:",
            {
              "Ref": "AWS::Partition",
            },
            ":iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
          ],
        ]
      })),
    }));
  });

  test('Lambda Version x0 Created', () => {
    expectCDK(stack).to(countResources("AWS::Lambda::Version", 0));
  });

  test('Snapshot', () => {
    expect(SynthUtils.toCloudFormation(stack)).toMatchSnapshot();
  });

});

const testRolePropsData = [
  { servicePrincipalNames: [ 'edgelambda.amazonaws.com' ] },
  { servicePrincipalNames: [ 'lambda.amazonaws.com', 'edgelambda.amazonaws.com' ] },
  {
    servicePrincipalNames: [ 'lambda.amazonaws.com', 'edgelambda.amazonaws.com' ],
    description: 'Test Construct "Lambda"',
  },
  {
    servicePrincipalNames: [ 'lambda.amazonaws.com', 'edgelambda.amazonaws.com' ],
    managedPolicieNames: [ 'service-role/AWSLambdaBasicExecutionRole' ],
  },
  {
    servicePrincipalNames: [ 'lambda.amazonaws.com', 'edgelambda.amazonaws.com' ],
    managedPolicieNames: [ 'service-role/AWSLambdaBasicExecutionRole', 'AmazonS3ReadOnlyAccess' ],
  },
  {
    servicePrincipalNames: [ 'lambda.amazonaws.com', 'edgelambda.amazonaws.com' ],
    description: 'Test Construct "Lambda"' ,
    managedPolicieNames: [ 'service-role/AWSLambdaBasicExecutionRole', 'AmazonS3ReadOnlyAccess' ],
  },
];
const testRolePropsTable = [];
for (const testRoleProps of testRolePropsData) {
  testRolePropsTable.push([
    JSON.stringify(testRoleProps),
    testRoleProps,
  ]);
}
describe.each(testRolePropsTable)('Test Construct "Lambda" by option { role: %j }', (json, testRoleProps) => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, "TestStack");
  if (typeof testRoleProps != 'string') {
    new AwsCdkLibLambda.Lambda(stack, 'MyTestConstruct', {
      func: {
        code: lambda.Code.fromAsset('./test/sample/code.zip'),
        handler: 'index',
        runtime: lambda.Runtime.NODEJS_12_X,
      },
      role: testRoleProps,
    });
  } else {
    throw new Error('ERROR: Type of RoleProps is string');
  }
  
  test('Lambda Function x1 Created', () => {
    expectCDK(stack).to(countResources("AWS::Lambda::Function", 1));
  });
  
  test('IAM Role x1 Created', () => {
    expectCDK(stack).to(countResources("AWS::IAM::Role", 1));
  });

  test('IAM Role Property "AssumeRolePolicyDocument" has "' + testRoleProps.servicePrincipalNames.join(', ') + '"', () => {
    expectCDK(stack).to(haveResourceLike("AWS::IAM::Role", {
      AssumeRolePolicyDocument: {
        Statement: arrayWith(
          objectLike({
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
              Service: testRoleProps.servicePrincipalNames.length > 1 ? testRoleProps.servicePrincipalNames : testRoleProps.servicePrincipalNames[0],
            },
          }),
        ),
      },
    }));
  });

  if (testRoleProps.description) {
    test('IAM Role Property "Description" is "' + testRoleProps.description + '"', () => {
      expectCDK(stack).to(haveResourceLike("AWS::IAM::Role", {
        Description: testRoleProps.description,
      }));
    });
  } else {
    test('IAM Role Property "Description" is none', () => {
      expectCDK(stack).to(haveResourceLike("AWS::IAM::Role", {
        Description: ABSENT,
      }));
    });
  }

  if (testRoleProps.managedPolicieNames) {
    test.each(testRoleProps.managedPolicieNames)('IAM Role Property "ManagedPolicyArns" is "%s"', (managedPoliciesName) => {
      expectCDK(stack).to(haveResourceLike("AWS::IAM::Role", {
        ManagedPolicyArns: arrayWith(objectLike({
          "Fn::Join": [
            "",
            [
              "arn:",
              {
                "Ref": "AWS::Partition",
              },
              ":iam::aws:policy/" + managedPoliciesName,
            ],
          ]
        })),
      }));
    });
  } else {
    test('IAM Role Property "ManagedPolicyArns" is none', () => {
      expectCDK(stack).to(haveResourceLike("AWS::IAM::Role", {
        ManagedPolicyArns: ABSENT,
      }));
    });
  }

});

describe.each([
  [ { name: codeSha256 } ],
  [ { name: codeSha256, removalPolicy: cdk.RemovalPolicy.DESTROY } ],
  [ { name: codeSha256, removalPolicy: cdk.RemovalPolicy.RETAIN } ],
])('Test Construct "Lambda" by option { version: %j }', (option) => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, "TestStack");
  new AwsCdkLibLambda.Lambda(stack, 'MyTestConstruct', {
    func: {
      code: lambda.Code.fromAsset('./test/sample/code.zip'),
      handler: 'index',
      runtime: lambda.Runtime.NODEJS_12_X,
    },
    version: option,
  });

  test('Lambda Function x1 Created', () => {
    expectCDK(stack).to(countResources("AWS::Lambda::Function", 1));
  });

  test('IAM Role x1 Created', () => {
    expectCDK(stack).to(countResources("AWS::IAM::Role", 1));
  });

  test('IAM Role Property "AssumeRolePolicyDocument" has "lambda.amazonaws.com"', () => {
    expectCDK(stack).to(haveResourceLike("AWS::IAM::Role", {
      AssumeRolePolicyDocument: {
        Statement: arrayWith(
          objectLike({
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
              Service: "lambda.amazonaws.com",
            },
          }),
        ),
      },
    }));
  });

  test('IAM Role Property "ManagedPolicyArns" has "AWSLambdaBasicExecutionRole"', () => {
    expectCDK(stack).to(haveResourceLike("AWS::IAM::Role", {
      ManagedPolicyArns: arrayWith(objectLike({
        "Fn::Join": [
          "",
          [
            "arn:",
            {
              "Ref": "AWS::Partition",
            },
            ":iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
          ],
        ]
      })),
    }));
  });

  test('Lambda Version x1 Created', () => {
    expectCDK(stack).to(countResources("AWS::Lambda::Version", 1));
  });
  
});

describe('Test Construct "Lambda" by option various', () => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, "TestStack");
  new AwsCdkLibLambda.Lambda(stack, 'MyTestConstruct', {
    func: {
      code: lambda.Code.fromAsset('./test/sample/code.zip'),
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

  test('Lambda Function x1 Created', () => {
    expectCDK(stack).to(countResources("AWS::Lambda::Function", 1));
  });

  test('IAM Role x1 Created', () => {
    expectCDK(stack).to(countResources("AWS::IAM::Role", 1));
  });

  test('IAM Role Property "AssumeRolePolicyDocument" has "lambda.amazonaws.com"', () => {
    expectCDK(stack).to(haveResourceLike("AWS::IAM::Role", {
      AssumeRolePolicyDocument: {
        Statement: arrayWith(
          objectLike({
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
              Service: [ 'lambda.amazonaws.com', 'edgelambda.amazonaws.com' ],
            },
          }),
        ),
      },
    }));
  });

  test('IAM Role Property "Description" is "Test Construct "Lambda""', () => {
    expectCDK(stack).to(haveResourceLike("AWS::IAM::Role", {
      Description: 'Test Construct "Lambda"',
    }));
  });

  test('IAM Role Property "ManagedPolicyArns" has "AWSLambdaBasicExecutionRole"', () => {
    expectCDK(stack).to(haveResourceLike("AWS::IAM::Role", {
      ManagedPolicyArns: arrayWith(objectLike({
        "Fn::Join": [
          "",
          [
            "arn:",
            {
              "Ref": "AWS::Partition",
            },
            ":iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
          ],
        ]
      })),
    }));
  });

  test('IAM Role Property "ManagedPolicyArns" has "AmazonS3ReadOnlyAccess"', () => {
    expectCDK(stack).to(haveResourceLike("AWS::IAM::Role", {
      ManagedPolicyArns: arrayWith(objectLike({
        "Fn::Join": [
          "",
          [
            "arn:",
            {
              "Ref": "AWS::Partition",
            },
            ":iam::aws:policy/AmazonS3ReadOnlyAccess",
          ],
        ]
      })),
    }));
  });

  test('Lambda Version x1 Created', () => {
    expectCDK(stack).to(countResources("AWS::Lambda::Version", 1));
  });

  test('Snapshot', () => {
    expect(SynthUtils.toCloudFormation(stack)).toMatchSnapshot();
  });

});
