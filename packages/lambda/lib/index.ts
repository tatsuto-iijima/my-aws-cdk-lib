import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda';

export interface LambdaProps {
  func: lambda.FunctionProps;
  role?: {
    servicePrincipalNames: string[];
    description?: string;
    managedPolicieNames?: string[];
  };
  version?: {
    name: string;
    removalPolicy?: cdk.RemovalPolicy;
  };
}

export class Lambda extends cdk.Construct {
  public readonly role: iam.Role;

  public readonly func: lambda.Function;

  public readonly version: lambda.Version;

  constructor(scope: cdk.Construct, id: string, props: LambdaProps) {
    super(scope, id);

    const finalLambdaProps: any = {};
    Object.assign(finalLambdaProps, props.func);
    
    if (!finalLambdaProps.role && props.role) {
      const finalRoleProps:any = {};
      const servicePrincipals: iam.ServicePrincipal[] = [];
      for (const servicePricipalName of props.role.servicePrincipalNames) {
        servicePrincipals.push(new iam.ServicePrincipal(servicePricipalName));
      }
      finalRoleProps.assumedBy = new iam.CompositePrincipal(...servicePrincipals);
      if (props.role.description) finalRoleProps.description = props.role.description;
      if (props.role.managedPolicieNames) {
        const managedPolicies: iam.IManagedPolicy[] = [];
        for (const mangagedPolicieName of props.role.managedPolicieNames) {
          managedPolicies.push(iam.ManagedPolicy.fromAwsManagedPolicyName(mangagedPolicieName));
        }
        finalRoleProps.managedPolicies = managedPolicies;
      }
      this.role = new iam.Role(this, 'Role', finalRoleProps);
      finalLambdaProps.role = this.role;
    }

    this.func = new lambda.Function(this, 'Function', finalLambdaProps);

    if (props.version) {
      const finalVersionProps:any = {
        lambda: this.func,
      };
      if (props.version.removalPolicy) finalVersionProps.removalPolicy = props.version.removalPolicy;
      this.version = new lambda.Version(this, 'Version-' + props.version.name, finalVersionProps);
    }

  }

}
