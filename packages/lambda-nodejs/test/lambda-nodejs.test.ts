import { expect as expectCDK, countResources, haveResource, ABSENT, arrayWith, objectLike, haveResourceLike, SynthUtils } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as AwsCdkLibLambdaNodejs from '../lib/index';

describe('Test Construct "LambdaNodejs" by default', () => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, "TestStack");
  new AwsCdkLibLambdaNodejs.LambdaNodejs(stack, 'MyTestConstruct');

  test('Lambda Function x1 Created', () => {
    expectCDK(stack).to(countResources("AWS::Lambda::Function", 1));
  });

  // In aws-lambda-nodejs, "lambda.amazonaws.com" is set in AssumeRole
  // and "AWSLambdaBasicExecutionRole" is set in ManagedPolicy　as standard Role.
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

  // test('Snapshot', () => {
  //   expect(SynthUtils.toCloudFormation(stack)).toMatchSnapshot();
  // });
});

const testRolePropsData = [
  {},
  { description: 'Test Construct "LambdaNodejs"' },
  { managedPolicies: [ 'service-role/AWSLambdaBasicExecutionRole' ] },
  { description: 'Test Construct "LambdaNodejs"' , managedPolicies: [ 'service-role/AWSLambdaBasicExecutionRole' ] },
  { description: 'Test Construct "LambdaNodejs"' , managedPolicies: [ 'service-role/AWSLambdaBasicExecutionRole', 'service-role/AmazonS3ReadOnlyAccess' ] },
];
const testRolePropsTable = [];
for (const testRoleProps of testRolePropsData) {
  testRolePropsTable.push([
    JSON.stringify(testRoleProps),
    testRoleProps,
  ]);
}

// console.log(JSON.stringify(testRolePropsTable, undefined, 2));  // for Debug

describe.each(testRolePropsTable)('Test Construct "LambdaNodejs" by option { role: %j }', (json, testRoleProps) => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, "TestStack");
  if (typeof testRoleProps != 'string') {
    new AwsCdkLibLambdaNodejs.LambdaNodejs(stack, 'MyTestConstruct', {
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

  if (testRoleProps.managedPolicies) {
    test.each(testRoleProps.managedPolicies)('IAM Role Property "ManagedPolicyArns" is "%s"', (managedPoliciesName) => {
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

  test('Lambda Version x0 Created', () => {
    expectCDK(stack).to(countResources("AWS::Lambda::Version", 0));
  });

});

describe.each([
  [ { version: { removalPolicy: cdk.RemovalPolicy.DESTROY } } ],
  [ { version: { removalPolicy: cdk.RemovalPolicy.RETAIN } } ],
  [ { func: { entry: './lambda/test/index.ts', handler: 'handler' }, version: { removalPolicy: cdk.RemovalPolicy.DESTROY } } ],
])('Test Construct "LambdaNodejs" by option %j', (option) => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, "TestStack");
  new AwsCdkLibLambdaNodejs.LambdaNodejs(stack, 'MyTestConstruct', option);

  test('Lambda Function x1 Created', () => {
    expectCDK(stack).to(countResources("AWS::Lambda::Function", 1));
  });

  // In aws-lambda-nodejs, "lambda.amazonaws.com" is set in AssumeRole
  // and "AWSLambdaBasicExecutionRole" is set in ManagedPolicy　as standard Role.
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

const option =  {
  func: {
    entry: './lambda/test/index.ts',
    handler: 'handler',
  },
  role: {
    description: "for MyAwsCdkLibLambdaNodejsTest2Stack",
    managedPolicies: [
      "service-role/AWSLambdaBasicExecutionRole",
      "AmazonS3ReadOnlyAccess"
    ],
  },
  version: {
    removalPolicy: cdk.RemovalPolicy.RETAIN,
  },
};
describe('Test Construct "LambdaNodejs" by option ' + JSON.stringify(option), () => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, "TestStack");
  new AwsCdkLibLambdaNodejs.LambdaNodejs(stack, 'MyTestConstruct', option);

  // test('Snapshot', () => {
  //   expect(SynthUtils.toCloudFormation(stack)).toMatchSnapshot();
  // });

});
