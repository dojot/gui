#!/bin/bash -ex
if [ $TRAVIS_PULL_REQUEST == false ] ; then
  version="latest"
  if [ $TRAVIS_BRANCH != "master" ] ; then
    version=$TRAVIS_BRANCH
  fi

  DOCKER_TAG=$(echo ${version} | sed 's/\(.*\)\/\(.*\)/\1_\2/')
  pathdockerhub=${TRAVIS_REPO_SLUG}:${DOCKER_TAG}

  docker build -t ${pathdockerhub} . --build-arg DOJOT_VERSION=${DOCKER_TAG}
  echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin
  
  docker push $pathdockerhub
fi
