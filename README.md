dojot Graphical Management Interface
=====================================

This package implements a WEB user interface for the management and configuration of the
dojot's basic functionality.


# Build

To generate a production-ready version of the interface, run the commands below.

```shell
yarn install
yarn run build
```

# Development

To setup a development server environment, run the commands below.

```shell
yarn install
yarn run watch
```

# Docker

From a clean environment, the following commands create a new docker image capable of serving
the user interface.
```
It has three optional arguments:
 DOJOT_VERSION: Set the GUI version
 APPLICATION_URL: It is used to define the URL of the application and must end with / (ex: / dojot /)
 BASE_URL: It is used to define the API URL and must end with / (ex: / api /)
```

```shell
docker build -f docker/Dockerfile -t [tag name] --build-arg DOJOT_VERSION=[version] --build-arg APPLICATION_URL=[app url] --build-arg BASE_URL=[api url] .
```

To run the created image:

```shell
docker run -d [-n name] <tag name>
```


# License

Dojot's GUI source code is released under Apache License 2.0.

Check NOTICE and LICENSE files for more information.
