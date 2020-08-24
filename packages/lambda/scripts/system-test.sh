#!/usr/bin/env bash

if [[ $# -ge 3 ]]; then
  export AWS_ACCESS_KEY_ID=$1
  export AWS_SECRET_ACCESS_KEY=$2
  export AWS_DEFAULT_REGION=$3
else
  echo 1>&2 "Provide AWS account and region as first three args."
  echo 1>&2 "Additional args are passed through to cdk deploy."
  exit 1
fi

STACK_NAME0="MyAwsCdkLibLambdaTestStack0"
STACK_NAME1="MyAwsCdkLibLambdaTestStack1"

npm test -- --testMatch="**/*.system-test.ts" --testNamePattern="$STACK_NAME0 PreTest"
cdk deploy $STACK_NAME0 --require-approval never
npm test -- --testMatch="**/*.system-test.ts" --testNamePattern="$STACK_NAME0 After Deploy"
cdk destroy $STACK_NAME0 --force

npm test -- --testMatch="**/*.system-test.ts" --testNamePattern="$STACK_NAME1 PreTest"
cdk deploy $STACK_NAME1 --require-approval never
npm test -- --testMatch="**/*.system-test.ts" --testNamePattern="$STACK_NAME1 After Deploy"
cdk deploy $STACK_NAME1 --context assetpath="./bin/code2.zip" --require-approval never
npm test -- --testMatch="**/*.system-test.ts" --testNamePattern="$STACK_NAME1 After Update"
cdk destroy $STACK_NAME1 --force
