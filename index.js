let { toLogicalID } = require('@architect/utils')
let validate = require('./validate')

module.exports = function storage(arc, cfn) {

  let storagePrivate = arc['storage-private']

  // Only run if @storage-private is defined
  if (storagePrivate) {

    // Validate the specified format
    validate(storagePrivate)

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
              's3:DeleteObject',
              's3:GetObject',
              's3:ListBucket',
              's3:PutObject'
            ],
            Resource: []
          }]
        },
        Roles: [{'Ref': 'Role'}],
      }
    }

    let resKeys = Object.keys(cfn.Resources)

    // storagePrivate is an array of names for our private buckets
    storagePrivate.forEach(bucket=> {

      // Resource names
      let ID = toLogicalID(bucket)
      let Bucket = `${ID}Bucket`
      let BucketParam = `${ID}Param`

      // Add bucket name as a "ARC_STORAGE_PRIVATE_<bucketname>" env var to all Lambda functions
      resKeys.forEach((k) => {
        let BUCKET = `ARC_STORAGE_PRIVATE_${bucket.replace(/-/g, '_').toUpperCase()}`
        if (cfn.Resources[k].Type === 'AWS::Serverless::Function') {
          cfn.Resources[k].Properties.Environment.Variables[BUCKET] = { Ref: Bucket }
        }
      })

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
