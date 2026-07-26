import { CfnOutput, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

export class WeatherApiV2Stack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const table = new dynamodb.Table(this, 'WeatherDataTable', {
      tableName: 'weather-api-v2-data',
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.RETAIN,
    });

    const userPool = new cognito.UserPool(this, 'WeatherUserPool', {
      userPoolName: 'weather-api-v2-users',
      selfSignUpEnabled: false,
      signInAliases: { email: true },
    });

    const handler = new lambda.Function(this, 'WeatherHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
exports.handler = async (event) => ({
  statusCode: 200,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    service: "weather-api-v2",
    path: event.path,
    message: "Replace this inline handler with domain Lambda handlers."
  })
});
`),
      environment: { TABLE_NAME: table.tableName },
    });

    table.grantReadWriteData(handler);
    handler.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['cognito-idp:AdminGetUser'],
        resources: [userPool.userPoolArn],
      })
    );

    const api = new apigw.RestApi(this, 'WeatherApi', {
      restApiName: 'weather-api-v2',
      deployOptions: { stageName: 'prod' },
      defaultCorsPreflightOptions: {
        allowOrigins: apigw.Cors.ALL_ORIGINS,
        allowMethods: apigw.Cors.ALL_METHODS,
      },
    });

    const status = api.root.addResource('api').addResource('status');
    status.addMethod('GET', new apigw.LambdaIntegration(handler));

    new CfnOutput(this, 'ApiUrl', { value: api.url });
    new CfnOutput(this, 'TableName', { value: table.tableName });
    new CfnOutput(this, 'UserPoolId', { value: userPool.userPoolId });
  }
}
