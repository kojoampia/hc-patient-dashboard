#!/bin/bash

args=$#

if [ $args -le 0 ];then
    echo "a random version will be used"
    
fi

echo "Synchronising with master on bitbucket"

git pull -r

# Set the version for the build and deploy
export version=$1
echo "Building and Deploying to Health Connect Patient Dashboard version $version"

name=patientdashboard
folder=`pwd`

if [[ "$folder" != *"$name"* ]]; then
  folder=$folder/$name
fi

echo "$folder"
cd $folder


echo "building..."
docker build -t "patientdashboard" .
echo "done."

echo "tagging..."
docker tag hc-patient-dashboard docker-registry.jojoaddison.net/hc-patient-dashboard:$version
docker image ls | grep 'hc-patient-dashboard'
echo "done."

echo "pushing..."
docker push docker-registry.jojoaddison.net/hc-patient-dashboard:$version
echo "done."
echo "build and deploy completed."
