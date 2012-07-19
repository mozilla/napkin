# Napkin

## Summary

Napkin is a rapid web prototyping tool meant for users who want to make functional, revisionable mockups that can easily be shared and exported to baseline front and back-end code.

## High-Level Overview

[Overview](https://github.com/mozilla/napkin/blob/master/docs/overview.md)

## Installation Instructions

Clone the repository

    $ git clone git://github.com/mozilla/napkin.git

Install brew; instructions: https://github.com/mxcl/homebrew/wiki/installation.
Next, use brew to get redis:

    $ brew install redis

Run redis in the background

    $ redis-server &

Install node by using brew or through the website http://nodejs.org/#download

    $ cd napkin
    $ cp local.json-dist local.json
    $ npm install

Run napkin on http://localhost:3000:

    $ node app.js

Run tests (optional):

    $ make test
