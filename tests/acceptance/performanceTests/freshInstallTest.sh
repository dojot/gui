#!/usr/bin/env bash
# variables assignment
# [[ ! -z "$1" ]] && RANGE_USERS_INIT=$1 || RANGE_USERS_INIT=1
# [[ ! -z "$2" ]] && RANGE_USERS_END=$2 || RANGE_USERS_END=5
[[ ! -z "$1" ]] && HOST=$1 || HOST="http://localhost:8000"
[[ ! -z "$2" ]] && USERNAME=$2 || USERNAME="admin"
[[ ! -z "$3" ]] && PASSWD=$3 || PASSWD="admin"
# [[ ! -z "$4" ]] && GROUP=$4 || GROUP="user"

# Login to get JWT Token

JWT=$(curl --silent -X POST ${HOST}/auth \
-H "Content-Type:application/json" \
-d "{\"username\": \"${ADM_USERNAME}\", \"passwd\" : \"${ADM_PASSWD}\"}" | jq '.jwt' | tr -d '"')

ech $JWT