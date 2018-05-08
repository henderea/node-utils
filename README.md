# @henderea/node-utils

Some utility scripts written in NodeJS and distributed via NPM.

## Installing

```shell
npm install -g @henderea/node-utils
```

## Scripts

### xpath-get

Get a value from a file using xpath

#### Usage

```shell
xpath-get FILENAME XPATH
```

```shell
xpath-get pom.xml "/project/dependencies/dependency[artifactId='log4j']/version/text()"
```

You can also call `xpath-get help`, `xpath-get --help`, or `xpath-get -h` to get usage info.

### xpath-set

Set a node's text content in a file using xpath

#### Usage

```shell
xpath-set FILENAME XPATH VALUE
```

```shell
xpath-set pom.xml "/project/dependencies/dependency[artifactId='log4j']/version" "4.0.0"
```

You can also call `xpath-set help`, `xpath-set --help`, or `xpath-set -h` to get usage info.

You can pass `-y` or `--yes` as the **first** argument to `xpath-set` to automatically confirm the change.  **It must be the first argument if provided**