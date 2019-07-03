#!/usr/bin/env bash
# variables assignment
[[ ! -z "$1" ]] && RANGE_USERS_INIT=$1 || RANGE_USERS_INIT=1
[[ ! -z "$2" ]] && RANGE_USERS_END=$2 || RANGE_USERS_END=5
[[ ! -z "$3" ]] && HOST=$3 || HOST="http://localhost:8000"
[[ ! -z "$4" ]] && GROUP=$4 || GROUP="user"

# Login to get JWT Token
ADM_USERNAME='admin'
ADM_PASSWD='admin'

USR_PREFIX='usuariodojot'
# PASS_PREFIX=`head -c10 | /dev/random tr -dc _a-z-0-9`

# echo "PASS_PREFIX CONTENT ${PASS_PREFIX}"
# exit

JWT=$(curl --silent -X POST ${HOST}/auth \
-H "Content-Type:application/json" \
-d "{\"username\": \"${ADM_USERNAME}\", \"passwd\" : \"${ADM_PASSWD}\"}" | jq '.jwt' | tr -d '"')

echo " _____________________________________________ ";
echo "|                                             |";
echo "|      USUÁRIO        |       NOVA SENHA      |";
echo "|_____________________________________________|";

for i in $(seq ${RANGE_USERS_INIT} ${RANGE_USERS_END});
do

    PASS_PREFIX=$(tr -dc 'a-z0-9' < /dev/urandom | head -c8)
    
    JSON_CREATE_USER='{"username":"'"${USR_PREFIX}"''"${i}"'","service":"'"${USR_PREFIX}"''"${i}"'","email":"'"${USR_PREFIX}"''"${i}"'@noemail.com","name":"'"${USR_PREFIX}"''"${i}"'","profile":"'"$GROUP"'"}'

    # request to create user
    CREATE_USER_RESPONSE=$( curl \
    -H "Content-Type:application/json" \
    -H "Connection:keep-alive" \
    -H "Authorization:Bearer ${JWT}" \
    --silent \
    --write-out "HTTPSTATUS:%{http_code}" \
    -X POST \
    --data ${JSON_CREATE_USER} \
    ${HOST}/auth/user/)


    # extract the status
    CREATE_USER_STATUS=$(echo ${CREATE_USER_RESPONSE} | tr -d '\n' | sed -E 's/.*HTTPSTATUS:([0-9]{3})$/\1/')

    # print message based on status
    if [ ! "${CREATE_USER_STATUS}" -eq 200 ]; then

        echo "ERRO: ${CREATE_USER_RESPONSE}";
    fi


    # Request to login with user to get his JWT Token
    LOGIN_USER_RESPONSE=$(curl \
    -H 'Content-Type: application/json' \
    --silent \
    -X POST \
    --data '{"username":"'"${USR_PREFIX}"''"${i}"'","passwd": "temppwd"}' \
    ${HOST}/auth/)

    # extract the token
    LOGGED_USER_TOKEN=$(echo ${LOGIN_USER_RESPONSE} | jq '.jwt')

    # print message based on status
    if [[ -z "${LOGGED_USER_TOKEN}" ]]; then
        echo "ERRO: ${LOGIN_USER_RESPONSE}";
        exit 1
    fi

    #json object to change password
    JSON_CHANGE_PSWD_OBJ='{"oldpasswd":"temppwd","newpasswd":"'${PASS_PREFIX}'"}'

    #request to change password
    CHANGE_USER_PSWD_RESPONSE=$(curl \
    -H "Content-Type:application/json" \
    -H "Connection:keep-alive" \
    -H "Authorization:Bearer '${LOGGED_USER_TOKEN}'" \
    --silent \
    -X POST \
    --data ${JSON_CHANGE_PSWD_OBJ} \
    ${HOST}/auth/password/update/ | jq '.message' | tr -d '"')


    # extract the message from response to change user pswd
    PSWD_USER_MESSAGE=$(echo ${CHANGE_USER_PSWD_RESPONSE} )

    # print message based on status
    if [[ ! ${PSWD_USER_MESSAGE} = "ok" ]]; then
        echo "ERRO: ${CHANGE_USER_PSWD_RESPONSE}";
        exit 1
    else
        echo "";
        echo "|     ${USR_PREFIX}${i}       |      ${PASS_PREFIX}     |";
        echo "";
    fi
done

echo "|_____________________________________________|";
