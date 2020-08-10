#!/bin/bash

if [ -d "layer" ] && [ -f "layer/nodejs/package.json" ]
  then
    cd layer/nodejs || exit
    npm i
    cd ../../
fi