[<img src="https://assets.arc.codes/architect-logo-500b@2x.png" width=500>](https://www.npmjs.com/package/@architect/architect)

## [`@architect/plugin-storage-private`](https://www.npmjs.com/package/@architect/plugin-storage-private)

> Architect serverless framework plugin that defines any number of arbitrary **private** S3 buckets for your application

[`@architect/plugin-storage-private`](https://www.npmjs.com/package/@architect/plugin-storage-private) provisions **private** S3 buckets for your application. If you need to provision **public** S3 buckets, check out [`@architect/plugin-storage-public`](https://www.npmjs.com/package/@architect/plugin-storage-public).


## Installation

1. Run: `npm i @architect/plugin-storage-private`

2. Then add the following line to the `@plugins` pragma in your Architect project manifest (usually `.arc`):

> Note, no `@` in the plugin name!

```
@plugins
architect/plugin-storage-private
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
  - Example: your app is named `myapp`, and your bucket is named `sensitive-data` in your `app.arc` file
  - Your Lambda(s) would read the `ARC_STORAGE_PRIVATE_SENSITIVE_DATA` env var (which would be assigned a value similar to `myappstaging-sensitivedatabucket-1f8394rh4qtvb`)
