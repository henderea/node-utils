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

### xpath-set

####