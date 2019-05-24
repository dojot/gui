#!/usr/bin/env bash
#param 1: initial range of user
[[ ! -z "$1" ]] && RANGE_USERS_INIT=$1 || RANGE_USERS_INIT=1

#param 2: end range of user
[[ ! -z "$2" ]] && RANGE_USERS_END=$2 || RANGE_USERS_END=3

#param 3: dojot host. Eg:  http://localhost:8000
[[ ! -z "$3" ]] && HOST=$3 || HOST='http://10.202.71.108:8000'

DOJOT_USERNAME='admin'
DOJOT_PASSWD='admin'

USERNAME_PREFIX='usuario'

echo 'Getting jwt token ...'
JWT=$(curl --silent -X POST ${HOST}/auth \
-H "Content-Type:application/json" \
-d "{\"username\": \"${DOJOT_USERNAME}\", \"passwd\" : \"${DOJOT_PASSWD}\"}" | jq '.jwt' | tr -d '"')
echo "... Got jwt token ${JWT}."

for i in $(seq ${RANGE_USERS_INIT} ${RANGE_USERS_END});
    do
        echo "Trying delete ${USERNAME_PREFIX}${i}";
DELETE_USER_RESPONSE=$(curl -w "\n%{http_code}" --silent -X DELETE ${HOST}/auth/user/${USERNAME_PREFIX}${i} \
-H "Authorization: Bearer ${JWT}")
        echo "RESPONSE: $DELETE_USER_RESPONSE";
    done


