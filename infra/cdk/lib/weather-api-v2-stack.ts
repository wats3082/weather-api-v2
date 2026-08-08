import * as path from 'path';
import { CfnOutput, Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

export class WeatherApiV2Stack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const table = new dynamodb.Table(this, 'WeatherDataTable', {
      tableName: 'weather-api-v2-data',
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'expiresAt',
      removalPolicy: RemovalPolicy.RETAIN,
    });

    const userPool = new cognito.UserPool(this, 'WeatherUserPool', {
      userPoolName: 'weather-api-v2-users',
      selfSignUpEnabled: false,
      signInAliases: { email: true },
    });

    const backendRoot = path.join(__dirname, '..', '..', '..', 'backend', 'src');
    const env = {
      DATA_TABLE_NAME: table.tableName,
      OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY ?? '',
    };

    const mkFn = (id: string, entry: string) =>
      new lambdaNodejs.NodejsFunction(this, id, {
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: path.join(backendRoot, entry),
        handler: 'handler',
        timeout: Duration.seconds(15),
        memorySize: 512,
        environment: env,
        bundling: {
          externalModules: [],
          target: 'node20',
        },
      });

    const weatherCurrent = mkFn('WeatherCurrentFn', 'handlers/weather-current.ts');
    const weatherForecast = mkFn('WeatherForecastFn', 'handlers/weather-forecast.ts');
    const turbulencePredict = mkFn('TurbulencePredictFn', 'handlers/turbulence-predict.ts');
    const locationsList = mkFn('LocationsListFn', 'handlers/locations-list.ts');
    const locationsCreate = mkFn('LocationsCreateFn', 'handlers/locations-create.ts');
    const locationsDelete = mkFn('LocationsDeleteFn', 'handlers/locations-delete.ts');

    for (const fn of [weatherCurrent, weatherForecast, turbulencePredict, locationsList, locationsCreate, locationsDelete]) {
      table.grantReadWriteData(fn);
    }

    const api = new apigw.RestApi(this, 'WeatherApi', {
      restApiName: 'weather-api-v2',
      deployOptions: { stageName: 'prod' },
      defaultCorsPreflightOptions: {
        allowOrigins: apigw.Cors.ALL_ORIGINS,
        allowMethods: apigw.Cors.ALL_METHODS,
      },
    });

    const apiRoot = api.root.addResource('api');
    const weather = apiRoot.addResource('weather');
    weather.addResource('{city}').addMethod('GET', new apigw.LambdaIntegration(weatherCurrent));

    const forecast = apiRoot.addResource('forecast');
    forecast.addResource('{city}').addMethod('GET', new apigw.LambdaIntegration(weatherForecast));

    const turbulence = apiRoot.addResource('turbulence');
    turbulence.addResource('predict').addMethod('POST', new apigw.LambdaIntegration(turbulencePredict));

    const authorizer = new apigw.CognitoUserPoolsAuthorizer(this, 'WeatherAuthorizer', {
      cognitoUserPools: [userPool],
    });

    const locations = apiRoot.addResource('locations');
    locations.addMethod('GET', new apigw.LambdaIntegration(locationsList), {
      authorizer,
      authorizationType: apigw.AuthorizationType.COGNITO,
    });
    locations.addMethod('POST', new apigw.LambdaIntegration(locationsCreate), {
      authorizer,
      authorizationType: apigw.AuthorizationType.COGNITO,
    });
    locations.addResource('{id}').addMethod('DELETE', new apigw.LambdaIntegration(locationsDelete), {
      authorizer,
      authorizationType: apigw.AuthorizationType.COGNITO,
    });

    new CfnOutput(this, 'ApiUrl', { value: api.url });
    new CfnOutput(this, 'TableName', { value: table.tableName });
    new CfnOutput(this, 'UserPoolId', { value: userPool.userPoolId });
    new CfnOutput(this, 'UserPoolClientId', { value: new cognito.UserPoolClient(this, 'WeatherUserPoolClient', {
      userPool,
      authFlows: { userPassword: true, userSrp: true },
    }).userPoolClientId });
  }
}
