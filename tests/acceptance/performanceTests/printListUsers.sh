#!/usr/bin/env bash

RANGE_USERS_INIT=1
RANGE_USERS_END=5
USR_PREFIX='usertest'
PASS_PREFIX='dojotsenha'

for i in $(seq ${RANGE_USERS_INIT} ${RANGE_USERS_END});
do
        echo "";
        echo "Login: ${USR_PREFIX}"${i}"";
        echo "Senha: ${PASS_PREFIX}"${i}"";
        echo "";
done
