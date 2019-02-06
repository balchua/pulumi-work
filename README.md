# Pulumi

Pulumi is a Cloud Native Infrastructure as Code with real programming languages and a consistent programming model.

More details on [Pulumi](https://pulumi.io/).

This project demonstrate how to use Pulumi to deploy into your local Kubernetes.

This project also uses typescript to write the infrastructure codes instead of custom DSL.

## Getting started

### 1. Define your project

The first thing you need is to define a file named `Pulumi.yaml`.

This file contains the description on how Pulumi with interact with your code.  This is also the place where you define whether you want to use the pulumi provided state store or use local file system.

### 2. Define `package.json`.  Below is the minimum npm packages you need.

```
{
    "name": "exposed-deployment",
    "devDependencies": {
        "@types/node": "latest"
    },
    "dependencies": {
        "@pulumi/pulumi": "latest",
        "@pulumi/kubernetes": "latest"
    }
}
```

### 3. Initiate the pulumi stack.

`$ pulumi stack init`

This command will create the pulumi _Project_.  If you are using Pulumi provided state storage, you should have the project in `https://app.pulumi.com/[your user in pulumi]`

### 4. Install the npm packages

    `$ npm install`

    This command will not install the npm packages globally.

### 5. Add pulumi configuration    
`$ pulumi config set isLocal`

This command will prompt you to enter a value.  At the same time it will create a file named `Pulumi.pulumi-demo.yaml`

Where `pulumi-demo` is the name of the pulumi _Project_

`$ pulumi config set namespace`

This command will add a configuration named, `namespace`.

### 6. Add sqlserver secret
`$ pulumi config set sapassword --secret`

This will keep an encrypted text into the `Pulumi.pulumi-demo.yaml`.  You can then use this value in your code.

### 7. Deploy the application(s)

`$ pulumi up`

Pulumi will prompt you for the changes it will apply.

```
$ pulumi up -y
Previewing update (pulumi-demo):

    Type                                      Name                     Plan       
+   pulumi:pulumi:Stack                       pulumi-demo-pulumi-demo  create     
+   ├─ kubernetes:core:Secret                 sqlsecret                create     
+   ├─ kubernetes:core:PersistentVolumeClaim  techtalksdb-data         create     
+   ├─ kubernetes:core:PersistentVolume       sqlserver-data           create     
+   ├─ kubernetes:apps:StatefulSet            mssql                    create     
+   ├─ kubernetes:core:Service                mssql                    create     
+   ├─ kubernetes:apps:Deployment             techtalksapi             create     
+   ├─ kubernetes:core:Service                techtalksapi             create     
+   ├─ kubernetes:apps:Deployment             techtalkweb              create     
+   └─ kubernetes:core:Service                techtalkweb              create     

Resources:
    + 10 to create

Updating (pulumi-demo):

    Type                                      Name                     Status      
+   pulumi:pulumi:Stack                       pulumi-demo-pulumi-demo  created     
+   ├─ kubernetes:core:PersistentVolumeClaim  techtalksdb-data         created     
+   ├─ kubernetes:core:PersistentVolume       sqlserver-data           created     
+   ├─ kubernetes:core:Secret                 sqlsecret                created     
+   ├─ kubernetes:apps:StatefulSet            mssql                    created     
+   ├─ kubernetes:core:Service                mssql                    created     
+   ├─ kubernetes:apps:Deployment             techtalksapi             created     
+   ├─ kubernetes:core:Service                techtalksapi             created     
+   ├─ kubernetes:apps:Deployment             techtalkweb              created     
+   └─ kubernetes:core:Service                techtalkweb              created     

Resources:
    + 10 created

Duration: 1m17s
```

### 8. Clean up

`$ pulumi destroy`

This will cleanup all the kubernetes objects defined in this project.

```
$ pulumi destroy -y
Previewing destroy (pulumi-demo):

    Type                                      Name                     Plan       
-   pulumi:pulumi:Stack                       pulumi-demo-pulumi-demo  delete     
-   ├─ kubernetes:core:Service                techtalkweb              delete     
-   ├─ kubernetes:apps:Deployment             techtalkweb              delete     
-   ├─ kubernetes:core:Service                techtalksapi             delete     
-   ├─ kubernetes:apps:Deployment             techtalksapi             delete     
-   ├─ kubernetes:core:Service                mssql                    delete     
-   ├─ kubernetes:apps:StatefulSet            mssql                    delete     
-   ├─ kubernetes:core:PersistentVolumeClaim  techtalksdb-data         delete     
-   ├─ kubernetes:core:PersistentVolume       sqlserver-data           delete     
-   └─ kubernetes:core:Secret                 sqlsecret                delete     

Resources:
    - 10 to delete

Destroying (pulumi-demo):

    Type                                      Name                     Status      
-   pulumi:pulumi:Stack                       pulumi-demo-pulumi-demo  deleted     
-   ├─ kubernetes:core:Service                techtalkweb              deleted     
-   ├─ kubernetes:apps:Deployment             techtalkweb              deleted     
-   ├─ kubernetes:core:Service                techtalksapi             deleted     
-   ├─ kubernetes:apps:Deployment             techtalksapi             deleted     
-   ├─ kubernetes:core:Service                mssql                    deleted     
-   ├─ kubernetes:apps:StatefulSet            mssql                    deleted     
-   ├─ kubernetes:core:PersistentVolume       sqlserver-data           deleted     
-   ├─ kubernetes:core:Secret                 sqlsecret                deleted     
-   └─ kubernetes:core:PersistentVolumeClaim  techtalksdb-data         deleted     

Resources:
    - 10 deleted

Duration: 16s

```







