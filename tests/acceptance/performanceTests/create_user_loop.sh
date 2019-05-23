# variables assignment
[ ! -z "$1" ] && RANGE_USERS_INIT=$1 || RANGE_USERS_INIT=40
[ ! -z "$2" ] && RANGE_USERS_END=$2 || echo "NULL"
[ ! -z "$3" ] && HOST=$3 || HOST="http://localhost:8000"
[ ! -z "$4" ] && GROUP=$4 || GROUP="user"

# Login to get JWT Token

DOJOT_USERNAME='admin'
DOJOT_PASSWD='admin'

JWT=$(curl --silent -X POST ${HOST}/auth \
-H "Content-Type:application/json" \
-d "{\"username\": \"${DOJOT_USERNAME}\", \"passwd\" : \"${DOJOT_PASSWD}\"}" | jq '.jwt' | tr -d '"')

echo " _____________________________________________ ";
echo "|                                             |";
echo "|      USUÁRIO        |       NOVA SENHA      |";
echo "|_____________________________________________|";

for i in $(seq ${RANGE_USERS_INIT} ${RANGE_USERS_END});
do
    JSON_CREATE_USER='{"username":"usuario'"${i}"'","service":"usuario'"${i}"'","email":"usuario'"${i}"'@noemail.com","name":"usuario'"${i}"'","profile":"'"$GROUP"'"}'

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
    --data '{"username":"usuario'"${i}"'","passwd": "temppwd"}' \
    ${HOST}/auth/)

    # extract the token
    LOGGED_USER_TOKEN=$(echo ${LOGIN_USER_RESPONSE} | jq '.jwt')
    
    # print message based on status
    if [ -z "${LOGGED_USER_TOKEN}" ]; then
        echo "ERRO: ${LOGIN_USER_RESPONSE}";
        exit 1
    fi

    #json object to change password
    JSON_CHANGE_PSWD_OBJ='{"oldpasswd":"temppwd","newpasswd":"dojotsenha'${i}'"}'

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
        echo "|     usuario"${i}"       |      dojotsenha"${i}"     |";
        echo "";
    fi
done

echo "|_____________________________________________|";
