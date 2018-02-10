#!/bin/sh

if [ ! -d "node_modules" ]
then
    yarn install
fi

exec yarn dev
