# Napkin

## What It Is

A rapid web prototyping tool to create a functional wireframe.

## High-Level Documentation

[Overview](https://github.com/mozilla/napkin/blob/master/docs/overview.md)

## Installation Instructions

Clone the repository

> git clone git://github.com/mozilla/napkin.git

Install Brew and redis

Brew instructions: https://github.com/mxcl/homebrew/wiki/installation

> brew install redis

Run redis in the background

> redis-server &

Install node by using brew or through the website http://nodejs.org/#download

> cd napkin

> cp local.json-dist local.json

> npm install

Run the site

> node app.js

## Run Tests

> make test

