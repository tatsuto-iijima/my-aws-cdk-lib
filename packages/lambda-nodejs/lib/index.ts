import * as cdk from '@aws-cdk/core';
import * as lambdaNodejs from '@aws-cdk/aws-lambda-nodejs';
import * as iam from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda';
import * as fs from 'fs';
const jsSHA = require("jssha");

export interface LambdaNodejsProps {
  func?: lambdaNodejs.NodejsFunctionProps,
  role?: {
    description?: string;
    managedPolicies?: string[];
  },
  version?: {
    removalPolicy: cdk.RemovalPolicy;
  };
}

export class LambdaNodejs extends cdk.Construct {
  public readonly role: iam.Role;

  public readonly nodejsFunction: lambdaNodejs.NodejsFunction;

  public readonly version: lambda.Version;

  constructor(scope: cdk.Construct, id: string, props: LambdaNodejsProps = {}) {
    super(scope, id);

    const finalLambdaNodejsProps: any = {};
    Object.assign(finalLambdaNodejsProps, props.func);
    
    if (props.role) {
      this.role = new iam.Role(this, 'Role', {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        description: props.role.description,
      });
      if (props.role.managedPolicies) {
        for (const mangagedPolicie of props.role.managedPolicies) {
          this.role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName(mangagedPolicie));
        }
      }
      finalLambdaNodejsProps.role = this.role;
    }

    this.nodejsFunction = new lambdaNodejs.NodejsFunction(this, 'Function', finalLambdaNodejsProps);

    if (props.version) {
      let entry = './lib/index.Function.ts'
      if (props.func?.entry) entry = props.func.entry;
      const shaObj = new jsSHA("SHA-256", "TEXT", { encoding: "UTF8" });
      shaObj.update(fs.readFileSync(entry).toString());
      const hash = shaObj.getHash("HEX");
      this.version = new lambda.Version(this, 'Version-' + hash, {
        lambda: this.nodejsFunction,
        removalPolicy: props.version.removalPolicy,
      });
    }

  }

}
