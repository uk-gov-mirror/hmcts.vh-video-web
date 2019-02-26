# vh-video-web

## Updating client code via NSwag

The poject is utilising NSwag to auto-generate client code for the front-end. 

### Updating the front end Angular client code

The configuration for the front end TypeScript can be found in 'VideoWeb/VideoWeb/ClientApp/api-ts.nswag'

* Install the NSwag CLI (at least version 12)
* Install Dotnet SDK 2.2
* Ensure the MVC application is running. This can be managed by either:
  * ```dotnet run VideoWeb/VideoWeb/VideoWeb.csproj```
  * or via an IDE
* open a terminal at the folder containing the nswag file 'VideoWeb/VideoWeb/ClientApp'
* execute ```nswag run```

The latest version of the client code can be found in 'src/app/services/clients/api-client.ts'