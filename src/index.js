let { toLogicalID } = require('@architect/utils')
let validate = require('./validate')

module.exports = function storage (arc, cfn) {

  let storagePrivate = arc['storage-private']

  // Only run if @storage-private is defined
  if (storagePrivate) {

    // Validate the specified format
    validate(storagePrivate)

    // First thing we do is declare a role for our macro resources
    cfn.Resources.PrivateStorageMacroPolicy = {
      Type: 'AWS::IAM::Policy',
      DependsOn: 'Role',
      Properties: {
        PolicyName: 'PrivateStorageMacroPolicy',
        PolicyDocument: {
          Statement: [ {
            Effect: 'Allow',
            Action: [ 's3:*' ],
            Resource: []
          } ]
        },
        Roles: [ { 'Ref': 'Role' } ],
      }
    }

    let resKeys = Object.keys(cfn.Resources)

    // storagePrivate is an array of names for our private buckets
    storagePrivate.forEach(bucket => {

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
          PublicAccessBlockConfiguration: {
            // Displayed as: 'Block public access to buckets and objects granted through new access control lists (ACLs)'
            BlockPublicAcls: true,
            // Displayed as: 'Block public access to buckets and objects granted through new public bucket or access point policies'
            BlockPublicPolicy: true,
            // Displayed as: 'Block public access to buckets and objects granted through any access control lists (ACLs)'
            IgnorePublicAcls: true,
            // Displayed as: 'Block public and cross-account access to buckets and objects through any public bucket or access point policies'
            RestrictPublicBuckets: true
          },
          BucketEncryption: {
            ServerSideEncryptionConfiguration: [ {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256'
              }
            } ]
          }
        }
      }

      // Add name to SSM params for runtime discovery
      cfn.Resources[BucketParam] = {
        Type: 'AWS::SSM::Parameter',
        Properties: {
          Type: 'String',
          Name: {
            'Fn::Sub': [
              '/${AWS::StackName}/storage-private/${bucket}',
              { bucket }
            ]
          },
          Value: { Ref: Bucket }
        }
      }

      // Add IAM policy for least-priv runtime access
      let doc = cfn.Resources.PrivateStorageMacroPolicy.Properties.PolicyDocument.Statement[0]
      doc.Resource.push({
        'Fn::Sub': [
          'arn:aws:s3:::${bucket}',
          { bucket: { Ref: Bucket } }
        ]
      })
      doc.Resource.push({
        'Fn::Sub': [
          'arn:aws:s3:::${bucket}/*',
          { bucket: { Ref: Bucket } }
        ]
      })

    })
  }

  return cfn
}
