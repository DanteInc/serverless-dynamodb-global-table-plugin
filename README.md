# serverless-dynamodb-global-table-plugin

This plugin manages DynamoDB global tables.

As a service is deployed to each successive region the specified tables are added to their global table. Global tables are created on deploying to the first region.

> This plugin is designed to work in conjunction with the [_serverless-dynamodb-autoscaling-plugin_](https://github.com/DanteInc/serverless-dynamodb-autoscaling-plugin) plugin.

## Install plugin:

```
npm install --save-dev serverless-dynamodb-global-table-plugin
```

## serverless.yml:

```
plugins:
  - serverless-dynamodb-autoscaling-plugin
  - serverless-dynamodb-global-table-plugin

custom:
  autoscaling:
    - table: Table
      global: true # simply add the global flag
      read:
        ...
      write:
        ...

resources:
  Resources:
    Table:
      Type: AWS::DynamoDB::Table
      ...
```
