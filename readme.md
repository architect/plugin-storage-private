[<img src="https://s3-us-west-2.amazonaws.com/arc.codes/architect-logo-500b@2x.png" width=500>](https://www.npmjs.com/package/@architect/architect)

## [`@architect/macro-storage-private`](https://www.npmjs.com/package/@architect/macro-storage-private)

> Architect serverless framework macro that defines any number of arbitrary private S3 buckets for your application

## Installation

1. Run: `npm i @architect/macro-storage-private`

2. Then add the following line to the `@macros` pragma in your Architect project manifest (usually `.arc`):

> Note, no `@` in the macro name!

```
@macros
architect/macro-storage-private
```

3. Add a new `@storage-private` pragma

Define any number of S3 bucket names within `@storage-private`; the following characters are allowed: `[a-zA-Z0-9_-]`

```
@storage-private
sensitive-data
secureinfo
```


## Accessing your bucket names

- CloudFormation provisions these buckets, and by default your bucket name will be reformatted and provided a GUID by AWS
- Thus, to deterministically access your bucket name, your Lambdas will be assigned a `ARC_STORAGE_PRIVATE_<bucketname>` env var (with any dashes converted to underscores)
  - Example: your app is named `myapp`, and your bucket is named `sensitive-data` in your `.arc` file
  - Your Lambda(s) would read the `ARC_STORAGE_PRIVATE_SENSITIVE_DATA` env var (which would be assigned a value similar to `myappstaging-sensitivedatabucket-1f8394rh4qtvb`)
