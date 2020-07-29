import * as AWS from 'aws-sdk';
const jsSHA = require('jssha');
import * as fs from 'fs';
import { Lambda } from 'aws-sdk';

const stackNames = [
  'MyAwsCdkLibLambdaTestStack0',
  'MyAwsCdkLibLambdaTestStack1',
];

const cloudformation = new AWS.CloudFormation({
  apiVersion: '2010-05-15',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_DEFAULT_REGION,
});

let stackNum = 0;

describe(stackNames[stackNum] + ' PreTest', () => {
  const params: AWS.CloudFormation.ListStackResourcesInput = {
    StackName: stackNames[stackNum],
  };

  test('No Stack', async () => {
    await expect(listStackResourcesAll(cloudformation, params)).rejects.toThrow('Stack with id ' + stackNames[stackNum] + ' does not exist');
  });

});

describe(stackNames[stackNum] + ' After Deploy', () => {

  let stackResourceSummaries: any[];

  beforeAll(async () => {
    const params: AWS.CloudFormation.ListStackResourcesInput = {
      StackName: stackNames[stackNum],
    };
    stackResourceSummaries = await listStackResourcesAll(cloudformation, params, ['AWS::Lambda::Function', 'AWS::IAM::Role']);
  });

  test('Cloud Formation Check', async () => {
    expect(stackResourceSummaries).toEqual(expect.arrayContaining([
      expect.objectContaining({
        ResourceType: 'AWS::Lambda::Function',
        ResourceStatus: 'CREATE_COMPLETE',
      }),
      expect.objectContaining({
        ResourceType: 'AWS::IAM::Role',
        ResourceStatus: 'CREATE_COMPLETE',
      }),
    ]));
  });

  test('Lambda Check', async () => {
    const lambda = new AWS.Lambda({
      apiVersion: '2015-03-31',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_DEFAULT_REGION,
    });

    let functionName: string|undefined;
    for (const stackResourceSummarie of stackResourceSummaries) {
      if (stackResourceSummarie.ResourceType == 'AWS::Lambda::Function') {
        functionName = stackResourceSummarie.PhysicalResourceId;
      };
    }
    if (!functionName) throw new Error('No FunctionName');

    const params = {
      FunctionName: functionName,
    };
  
    const shaObj = new jsSHA("SHA-256", "ARRAYBUFFER");
    shaObj.update(fs.readFileSync('./bin/code.zip'));
    const codeSha256 = shaObj.getHash("B64");

    const result = await getFunction(lambda, params);
    expect(result.Configuration).toEqual(expect.objectContaining({
      CodeSha256: codeSha256,
    }));
  });

  test('IAM Role Check', async () => {
    const iam = new AWS.IAM({
      apiVersion: '2010-05-08',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_DEFAULT_REGION,
    });

    let roleName: string|undefined;
    for (const stackResourceSummarie of stackResourceSummaries) {
      if (stackResourceSummarie.ResourceType == 'AWS::IAM::Role') {
        roleName = stackResourceSummarie.PhysicalResourceId;
      };
    }
    if (!roleName) throw new Error('No RoleName');

    const params = {
      RoleName: roleName,
    };

    const result = await getRole(iam, params);
    const assumeRolePolicyDocument = JSON.parse(unescape(result.Role.AssumeRolePolicyDocument));
    expect(assumeRolePolicyDocument).toEqual(expect.objectContaining({
      Statement: expect.arrayContaining([
      expect.objectContaining({
        Effect: 'Allow',
        Action: 'sts:AssumeRole',
        Principal: {
          Service: 'lambda.amazonaws.com',
        },
      }),
    ])}));
  });

});

stackNum++;

describe(stackNames[stackNum] + ' PreTest', () => {
  const params: AWS.CloudFormation.ListStackResourcesInput = {
    StackName: stackNames[stackNum],
  };

  test('No Stack', async () => {
    await expect(listStackResourcesAll(cloudformation, params)).rejects.toThrow('Stack with id ' + stackNames[stackNum] + ' does not exist');
  });

});

describe(stackNames[stackNum] + ' After Deploy', () => {

  const lambda = new AWS.Lambda({
    apiVersion: '2015-03-31',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_DEFAULT_REGION,
  });

  const iam = new AWS.IAM({
    apiVersion: '2010-05-08',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_DEFAULT_REGION,
  });

  let stackResourceSummaries: any[];
  let functionName: string|undefined;
  let roleName: string|undefined;

  beforeAll(async () => {
    const params: AWS.CloudFormation.ListStackResourcesInput = {
      StackName: stackNames[stackNum],
    };
    stackResourceSummaries = await listStackResourcesAll(cloudformation, params, ['AWS::Lambda::Function', 'AWS::Lambda::Version', 'AWS::IAM::Role']);

    for (const stackResourceSummarie of stackResourceSummaries) {
      if (stackResourceSummarie.ResourceType == 'AWS::IAM::Role') {
        roleName = stackResourceSummarie.PhysicalResourceId;
      };
    }

    for (const stackResourceSummarie of stackResourceSummaries) {
      if (stackResourceSummarie.ResourceType == 'AWS::Lambda::Function') {
        functionName = stackResourceSummarie.PhysicalResourceId;
      };
    }
  
  });

  test('Cloud Formation Check', async () => {
    expect(stackResourceSummaries).toEqual(expect.arrayContaining([
      expect.objectContaining({
        ResourceType: 'AWS::Lambda::Function',
        ResourceStatus: 'CREATE_COMPLETE',
      }),
      expect.objectContaining({
        ResourceType: 'AWS::Lambda::Version',
        ResourceStatus: 'CREATE_COMPLETE',
      }),
      expect.objectContaining({
        ResourceType: 'AWS::IAM::Role',
        ResourceStatus: 'CREATE_COMPLETE',
      }),
    ]));
  });

  test('Lambda Function Check', async () => {
    if (!functionName) throw new Error('No FunctionName');
    const params = {
      FunctionName: functionName,
    };
  
    const shaObj = new jsSHA("SHA-256", "ARRAYBUFFER");
    shaObj.update(fs.readFileSync('./bin/code.zip'));
    const codeSha256 = shaObj.getHash("B64");

    const result = await getFunction(lambda, params);
    expect(result.Configuration).toEqual(expect.objectContaining({
      CodeSha256: codeSha256,
    }));
  });

  test('Lambda Version Check', async () => {
    if (!functionName) throw new Error('No FunctionName');
    const params = {
      FunctionName: functionName,
    };

    const result = await listVersionsByFunction(lambda, params);
    console.log(result);
    expect(result.Versions).toEqual(expect.arrayContaining([
      expect.objectContaining({
        Version: '1',
      })
    ]));
  });

  test('IAM Role Check', async () => {
    if (!roleName) throw new Error('No RoleName');
    const params = {
      RoleName: roleName,
    };

    const result = await getRole(iam, params);
    const assumeRolePolicyDocument = JSON.parse(unescape(result.Role.AssumeRolePolicyDocument));
    expect(assumeRolePolicyDocument).toEqual(expect.objectContaining({
      Statement: expect.arrayContaining([
      expect.objectContaining({
        Effect: 'Allow',
        Action: 'sts:AssumeRole',
        Principal: {
          Service: expect.arrayContaining(['lambda.amazonaws.com', 'edgelambda.amazonaws.com']),
        },
      }),
    ])}));
    expect(result.Role.Description).toEqual('Test Construct "Lambda"');
  });

});

describe(stackNames[stackNum] + ' After Update', () => {

  const lambda = new AWS.Lambda({
    apiVersion: '2015-03-31',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_DEFAULT_REGION,
  });
  
  const iam = new AWS.IAM({
    apiVersion: '2010-05-08',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_DEFAULT_REGION,
  });

  let stackResourceSummaries: any[];
  let functionName: string|undefined;
  let roleName: string|undefined;

  beforeAll(async () => {
    const params: AWS.CloudFormation.ListStackResourcesInput = {
      StackName: stackNames[stackNum],
    };
    stackResourceSummaries = await listStackResourcesAll(cloudformation, params, ['AWS::Lambda::Function', 'AWS::Lambda::Version', 'AWS::IAM::Role']);

    for (const stackResourceSummarie of stackResourceSummaries) {
      if (stackResourceSummarie.ResourceType == 'AWS::IAM::Role') {
        roleName = stackResourceSummarie.PhysicalResourceId;
      };
    }

    for (const stackResourceSummarie of stackResourceSummaries) {
      if (stackResourceSummarie.ResourceType == 'AWS::Lambda::Function') {
        functionName = stackResourceSummarie.PhysicalResourceId;
      };
    }

  });

  test('Cloud Formation Check', async () => {
    expect(stackResourceSummaries).toEqual(expect.arrayContaining([
      expect.objectContaining({
        ResourceType: 'AWS::Lambda::Function',
        ResourceStatus: 'UPDATE_COMPLETE',
      }),
      expect.objectContaining({
        ResourceType: 'AWS::Lambda::Version',
        ResourceStatus: 'CREATE_COMPLETE',
      }),
      expect.objectContaining({
        ResourceType: 'AWS::IAM::Role',
        ResourceStatus: 'CREATE_COMPLETE',
      }),
    ]));
  });

  test('Lambda Function Check', async () => {
    if (!functionName) throw new Error('No FunctionName');
    const params = {
      FunctionName: functionName,
    };
  
    const shaObj = new jsSHA("SHA-256", "ARRAYBUFFER");
    shaObj.update(fs.readFileSync('./bin/code2.zip'));
    const codeSha256 = shaObj.getHash("B64");

    const result = await getFunction(lambda, params);
    expect(result.Configuration).toEqual(expect.objectContaining({
      CodeSha256: codeSha256,
    }));
  });

  test('Lambda Version Check', async () => {
    if (!functionName) throw new Error('No FunctionName');
    const params = {
      FunctionName: functionName,
    };

    const result = await listVersionsByFunction(lambda, params);
    console.log(result);
    expect(result.Versions).toEqual(expect.arrayContaining([
      expect.objectContaining({
        Version: '2',
      })
    ]));
  });

  test('IAM Role Check', async () => {
    if (!roleName) throw new Error('No RoleName');
    const params = {
      RoleName: roleName,
    };

    const result = await getRole(iam, params);
    const assumeRolePolicyDocument = JSON.parse(unescape(result.Role.AssumeRolePolicyDocument));
    expect(assumeRolePolicyDocument).toEqual(expect.objectContaining({
      Statement: expect.arrayContaining([
      expect.objectContaining({
        Effect: 'Allow',
        Action: 'sts:AssumeRole',
        Principal: {
          Service: expect.arrayContaining(['lambda.amazonaws.com', 'edgelambda.amazonaws.com']),
        },
      }),
    ])}));
    expect(result.Role.Description).toEqual('Test Construct "Lambda"');
  });

});

async function listStackResourcesAll(
  cloudformation: AWS.CloudFormation,
  params: AWS.CloudFormation.ListStackResourcesInput,
  resourceTypes?: string[],
) {
  const testTarget: any[] = [];
  let nextPage: boolean = true;
  try {
    while (nextPage) {
      const result = await listStackResources(cloudformation, params);
      for (const stackResourceSummarie of result.StackResourceSummaries) {
        if (resourceTypes && resourceTypes.length > 0) {
          if (resourceTypes?.indexOf(stackResourceSummarie.ResourceType) > -1) testTarget.push(stackResourceSummarie);
        } else {
          testTarget.push(stackResourceSummarie);
        }
      }
      if (result.NextToken) {
        nextPage = true;
        params.NextToken = result.NextToken;
      } else {
        nextPage = false;
      }
    }
    return testTarget;
      
  } catch (error) {
    throw new Error(error);
  }
}

function listStackResources(
  cloudformation: AWS.CloudFormation,
  params: AWS.CloudFormation.ListStackResourcesInput
): Promise<any> {
  return new Promise((resolve, reject) => {
    cloudformation.listStackResources(params, (err, data) => {
      if (err) {
        reject(err.message);
      } else {
        resolve(data);
      }
    });
  });
}

function getFunction(
  lambda: AWS.Lambda,
  params: AWS.Lambda.GetFunctionRequest
): Promise<any> {
  return new Promise((resolve, reject) => {
    lambda.getFunction(params, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

function listVersionsByFunction(
  lambda: AWS.Lambda,
  params: AWS.Lambda.ListVersionsByFunctionRequest
): Promise<any> {
  return new Promise((resolve, reject) => {
    lambda.listVersionsByFunction(params, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

function getRole(
  iam: AWS.IAM,
  params: AWS.IAM.GetRoleRequest
): Promise<any> {
  return new Promise((resolve, reject) => {
    iam.getRole(params, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}
