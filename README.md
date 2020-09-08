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

```shell
docker build -f docker/Dockerfile -t [tag name] .
```

To run the created image:

```shell
docker run -d [-n name] <tag name>
```

# Acceptance Test

To run the acceptance test, run the commands below.

```shell
yarn install
yarn run test 
```
To clean the database (devices, templates and flows) and run the acceptance test, run the commands below.

```shell
yarn install
yarn run test:clearDb
```

There are 2 types of scenarios: Basic and Advanced.
In order to run each scenario, run the following command:

```shell
yarn run test:basic
yarn run test:adv
```
