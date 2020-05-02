module.exports = function storage(arc, cfn) {

  let arc['storage-private'] = storagePrivate

  // Only run if arc.storage is defined
  if (storagePrivate) {

    // First thing we do is declare a role for our macro resources
    cfn.Resources.StorageMacroPolicy = {
      Type: 'AWS::IAM::Policy',
      DependsOn: 'Role',
      Properties: {
        PolicyName: 'StorageMacroPolicy',
        PolicyDocument: {
          Statement: [{
            Effect: 'Allow',
            Action: [
              's3:GetObject',
              's3:PutObject',
              's3:DeleteObject'
            ],
            Resource: []
          }]
        },
        Roles: [{'Ref': 'Role'}],
      }
    }
    let resKeys = Object.keys(cfn.Resources);
    // storagePrivate is an array of names for our private buckets
    storagePrivate.forEach(bucket=> {

      // Resource names
      let Bucket = `${bucket}Bucket`
      let BucketParam = `${bucket}Param`

      // Add bucket name as a "STORAGE_PRIVATE_<bucketname>" env var to all Lambda functions
      resKeys.forEach((k) => {
        let BUCKET = `STORAGE_PRIVATE_${bucket.toUpperCase()}`
        if (cfn.Resources[k].Type === 'AWS::Serverless::Function') {
          cfn.Resources[k].Properties.Environment.Variables[BUCKET] = { Ref: Bucket };
        }
      });

      // Add standard CloudFormation resources
      cfn.Resources[Bucket] = {
        Type: 'AWS::S3::Bucket',
        DeletionPolicy: 'Delete',
        Properties: {
          BucketEncryption: {
            ServerSideEncryptionConfiguration: [{
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256'
              }
            }]
          }
        }
      }

      // Add name to ssm params for runtime discovery
      cfn.Resources[BucketParam] = {
        Type: 'AWS::SSM::Parameter',
        Properties: {
          Type: 'String',
          Name: {
            'Fn::Sub': [
              '/${AWS::StackName}/storage-private/${bucket}',
              {bucket}
            ]
          },
          Value: {Ref: Bucket}
        }
      }

      // Add iam policy for least-priv runtime access
      let doc = cfn.Resources.StorageMacroPolicy.Properties.PolicyDocument.Statement[0]
      doc.Resource.push({
        'Fn::Sub': [
          'arn:aws:s3:::${bucket}',
          {bucket: {'Ref': Bucket}}
        ]
      })

    })
  }

  return cfn
}
