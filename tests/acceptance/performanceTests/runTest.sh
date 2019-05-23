#!/bin/bash
#param 1: initial range of user
[[ ! -z "$1" ]] && RANGE_USERS_INIT=$1 || RANGE_USERS_INIT=1

#param 2: end range of user
[[ ! -z "$2" ]] && RANGE_USERS_END=$2 || RANGE_USERS_END=2

#param 3: dojot host. Eg:  http://localhost:8000
[[ ! -z "$3" ]] && DOJOT_HOST=$3 || DOJOT_HOST='http://10.202.71.108:8000'

#param 4: dojot mqtt host. Eg: http://localhost
[[ ! -z "$4" ]] && MQTT_HOST=$4 || MQTT_HOST='http://10.202.71.108'

#param 5: profile/group of users Eg.: user
[[ ! -z "$5" ]] && PROFILE=$5 || PROFILE='user'

echo "Create users."
sh $PWD/tests/acceptance/performanceTests/create_user_loop.sh ${RANGE_USERS_INIT} ${RANGE_USERS_END} ${DOJOT_HOST} ${PROFILE}
echo "Finish create users."

echo "Iniciate all tests."
for i in $(seq ${RANGE_USERS_INIT} ${RANGE_USERS_END});
    do
        echo "Test ${i} iniciate"
        docker run   --rm  \
        -e USERNAME=usertest${i} \
        -e PASSWORD=newusrpswd${i} \
        -e TENANT=usertest${i}  \
        -e DOJOT_HOST=${DOJOT_HOST} \
        -e MQTT_HOST=${MQTT_HOST} \
        -v $PWD:/tests \
        codeception/codeceptjs codeceptjs \
        --config=tests/acceptance/custom.conf.js run --grep "ManyTenants"  &
    done

