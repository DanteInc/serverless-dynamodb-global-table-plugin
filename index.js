class Plugin {
  constructor (serverless, options) {
    this.hooks = {
      'after:deploy:deploy': deploy.bind(null, serverless, options)
    };
  }
}

module.exports = Plugin;

const deploy = (serverless, options) => {
  if (!serverless.service.custom.autoscaling) { return Promise.resolve(); }

  const tap = _tap(serverless);
  const { Resources } = serverless.service.provider.compiledCloudFormationTemplate;

  return Promise.all(
    serverless.service.custom.autoscaling
      .filter(config => config.global)
      .map(config => ({ tableName: Resources[config.table].Properties.TableName }))
      .map(uow =>
        serverless.getProvider('aws').request('DynamoDB', 'describeGlobalTable', {
          GlobalTableName: uow.tableName
        })
          .then(data => ({ ...uow, ...data }))
          .then((uow) => {
            const { ReplicationGroup } = uow.GlobalTableDescription;
            if (ReplicationGroup.filter(region => region.RegionName === options.region).length === 0) {
              return serverless.getProvider('aws').request('DynamoDB', 'updateGlobalTable', {
                GlobalTableName: uow.tableName,
                ReplicaUpdates: [
                  {
                    Create: {
                      RegionName: options.region
                    }
                  }
                ]
              })
                .then(data => ({ ...uow, ...data }))
                .then(tap)
                .then((uow) => {
                  serverless.cli.log(`Updated global table: ${uow.tableName} with region: ${options.region}`);
                  return uow;
                });
              } else {
              return Promise.resolve(uow)
                .then(tap)
                .then((uow) => {
                  serverless.cli.log(`Region: ${options.region} already in global table: ${uow.tableName}`);
                  return uow;
                });
            }
          })
          .catch((e) => {
            serverless.cli.log(e.message);
            return serverless.getProvider('aws').request('DynamoDB', 'createGlobalTable', {
              GlobalTableName: uow.tableName,
              ReplicationGroup: [
                {
                  RegionName: options.region
                }
              ]
            })
              .then(data => ({ ...uow, ...data }))
              .then(tap)
              .then((uow) => {
                serverless.cli.log(`Created global table: ${uow.tableName} with region: ${options.region}`);
                return uow;
              });
          })
      )
  );
};

const _tap = serverless => (globalTable) => {
  serverless.cli.log(`globalTable: ${JSON.stringify(globalTable, null, 2)}`);
  return globalTable;
};
