#!/bin/bash -ex

version="latest"
if [ $TRAVIS_BRANCH != "master" ] ; then
  version=$TRAVIS_BRANCH
fi
tag=$TRAVIS_REPO_SLUG:$version


docker build -t $tag -f docker/Dockerfile .
docker login -u="$USERNAME" -p="$PASSWD"
docker push $tag
