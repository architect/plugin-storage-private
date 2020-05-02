module.exports = function storage(arc, cfn) {
  
  // only run if arc.storage is defined
  if (arc.storage) { 

    // first thing we do is declare a role for our macro resources
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
    // arc.storage is an array of names for our private buckets
    arc.storage.forEach(bucket=> {
      
      // resource names
      let Bucket = `${bucket}Bucket`
      let BucketParam = `${bucket}Param`
      
      // Add bucket name as a "STORAGE_<bucketname>" env var to all lambda functions
      resKeys.forEach((k) => {
        if (cfn.Resources[k].Type === 'AWS::Serverless::Function') {
          cfn.Resources[k].Properties.Environment.Variables[`STORAGE_${bucket}`] = { Ref: Bucket };
        }
      });
      
      // add standard cloudformation resources
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
      
      // add name to ssm params for runtime discovery
      cfn.Resources[BucketParam] = {
        Type: 'AWS::SSM::Parameter',
        Properties: {
          Type: 'String',
          Name: {
            'Fn::Sub': [
              '/${AWS::StackName}/storage/${bucket}',
              {bucket}
            ]
          },
          Value: {Ref: Bucket}
        }
      }

      // add iam policy for least-priv runtime access
      let doc = cfn.Resources.StorageMacroPolicy.Properties.PolicyDocument.Statement[0]
      doc.Resource.push({
        'Fn::Sub': [
          'arn:aws:s3:::${bucket}',
          {bucket: {'Ref': Bucket}}
        ]
      })

    // end arc.storage.forEach
    })
  }

  return cfn
}
