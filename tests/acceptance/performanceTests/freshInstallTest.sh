#!/bin/sh

#### user login ####
login() {
    # variables assignment
    [ ! -z "$1" ] && HOST=$1 || HOST="http://localhost:8000"
    [ ! -z "$2" ] && USERNAME=$2 || USERNAME="admin"
    [ ! -z "$3" ] && PASSWD=$3 || PASSWD="admin"

    # Login to get JWT Token

    local JWT=$(curl --silent -X POST ${HOST}/auth \
    -H "Content-Type:application/json" \
    -d "{\"username\": \"${USERNAME}\", \"passwd\" : \"${PASSWD}\"}" | jq '.jwt' | tr -d '"')
    
    echo $JWT
    # End of login
}


#### create templates ####

createPropertiesTemplate() {
    # variables assignment
    [ ! -z "$1" ] && HOST=$1 || HOST="http://localhost:8000"
    [ ! -z "$2" ] && TEMPLATE_NAME=$2 || TEMPLATE_NAME="T"

    # request to create template
    CREATE_TEMPLATE_RESPONSE=$( curl \
    -X POST ${HOST}/template \
    -H "Authorization: Bearer $token" \
    -H "Content-Type:application/json" \
    --silent \
    -d ' {
        "label": "'$TEMPLATE_NAME'_Properties",
        "attrs": [
            {
                "label": "protocol",
                "static_value": "mqtt",
                "type": "static",
                "value_type": "string"
            },
            {
                "label": "location",
                "static_value": "-22.893916,-47.060999",
                "type": "static",
                "value_type": "geo:point"
            }
        ]
    }'  \
    2>/dev/null)
    
    
    # extract the template id
    TEMPLATE_ID=$(echo ${CREATE_TEMPLATE_RESPONSE} | jq '.template.id' )

    # extract the status
    CREATE_TEMPLATE_RESULT=$(echo ${CREATE_TEMPLATE_RESPONSE} | jq '.result' )

    # print message based on status
    if [ -z "${CREATE_TEMPLATE_RESULT}" ]; then
        echo "ERRO ON CREATE TEMPLATE: ${CREATE_TEMPLATE_RESPONSE}"
        exit

    else 
        echo $TEMPLATE_ID
    fi

}

createTelemetryTemplate() {
    # variables assignment
    [ ! -z "$1" ] && HOST=$1 || HOST="http://localhost:8000"
    [ ! -z "$2" ] && TEMPLATE_NAME=$2 || TEMPLATE_NAME="T"

    # request to create template
    CREATE_TEMPLATE_RESPONSE=$( curl \
    -X POST ${HOST}/template \
    -H "Authorization: Bearer $token" \
    -H "Content-Type:application/json" \
    --silent \
    --write-out "HTTPSTATUS:%{http_code}" \
    -d ' {
        "label": "'${TEMPLATE_NAME}'_Telemetry",
        "attrs": [
            {
                "label": "rain",
                "type": "dynamic",
                "value_type": "float"
            },
            {
                "label": "humidity",
                "type": "dynamic",
                "value_type": "float"
            }
        ]
    }'  \
    2>/dev/null)
    
    
    # extract the status
    CREATE_TEMPLATE_STATUS=$(echo ${CREATE_TEMPLATE_RESPONSE} | tr -d '\n' | sed -E 's/.*HTTPSTATUS:([0-9]{3})$/\1/')

    # print message based on status
    if [ ! "${CREATE_TEMPLATE_STATUS}" -eq 200 ]; then
        echo "ERRO ON CREATE TEMPLATE: ${CREATE_TEMPLATE_RESPONSE}"
        exit
    fi

}


#### create devices ####
createDevice() {
    # variables assignment
    [ ! -z "$1" ] && HOST=$1 || HOST="http://localhost:8000"
    [ ! -z "$2" ] && DEVICE_NAME=$2 || DEVICE_NAME="D"

    # request to create device
    CREATE_DEVICE_RESPONSE=$( curl \
    -X POST ${HOST}/device \
    -H "Authorization: Bearer $token" \
    -H 'Content-Type:application/json' \
    --silent \
    --write-out "HTTPSTATUS:%{http_code}" \
    -d ' {"templates" : [1, 2],
        "label" : "'${DEVICE_NAME}'"
    }' \
    2>/dev/null)
    
    # extract the status
    CREATE_DEVICE_STATUS=$(echo ${CREATE_DEVICE_RESPONSE} | tr -d '\n' | sed -E 's/.*HTTPSTATUS:([0-9]{3})$/\1/')

    # print message based on status
    if [ ! "${CREATE_DEVICE_STATUS}" -eq 200 ]; then
        echo "ERRO ON CREATE DEVICE: ${CREATE_DEVICE_RESPONSE}"
        exit
    fi
}


createTemperatureTemplate() {
    # variables assignment
    [ ! -z "$1" ] && HOST=$1 || HOST="http://localhost:8000"

    # request to create template
    CREATE_TEMPERATURE_RESPONSE=$( curl \
    -X POST ${HOST}/template \
    -H "Authorization: Bearer $token" \
    -H "Content-Type:application/json" \
    --silent \
    --write-out "HTTPSTATUS:%{http_code}" \
    -d ' {
        "label": "Temperature_Telemetry",
        "attrs": [
            {
                "label": "temperature",
                "type": "dynamic",
                "value_type": "float"
            }
        ]
    }'  \
    2>/dev/null)
    
    # extract the status
    CREATE_TEMPLATE_STATUS=$(echo ${CREATE_TEMPERATURE_RESPONSE} | tr -d '\n' | sed -E 's/.*HTTPSTATUS:([0-9]{3})$/\1/')

    # print message based on status
    if [ ! "${CREATE_TEMPLATE_STATUS}" -eq 200 ]; then
        echo "ERRO ON CREATE TEMPLATE: ${CREATE_TEMPERATURE_RESPONSE}"
        exit
    fi

}


#### create devices ####
createTermometerDevice() {
    # variables assignment
    [ ! -z "$1" ] && HOST=$1 || HOST="http://localhost:8000"
    [ ! -z "$2" ] && DEVICE_NAME=$2 || DEVICE_NAME="Termometer"

    # request to create device
    CREATE_DEVICE_RESPONSE=$( curl \
    -X POST ${HOST}/device \
    -H "Authorization: Bearer $token" \
    -H 'Content-Type:application/json' \
    --silent \
    --write-out "HTTPSTATUS:%{http_code}" \
    -d ' {"templates" : [1, 3],
        "label" : "'${DEVICE_NAME}'"
    }' \
    2>/dev/null)
    
    # extract the status
    CREATE_DEVICE_STATUS=$(echo ${CREATE_DEVICE_RESPONSE} | tr -d '\n' | sed -E 's/.*HTTPSTATUS:([0-9]{3})$/\1/')

    # print message based on status
    if [ ! "${CREATE_DEVICE_STATUS}" -eq 200 ]; then
        echo "ERRO ON CREATE DEVICE: ${CREATE_DEVICE_RESPONSE}"
        exit
    fi
}


#### create Weather Station Device ####
createWeatherStationDevice() {
    # variables assignment
    [ ! -z "$1" ] && HOST=$1 || HOST="http://localhost:8000"
    [ ! -z "$2" ] && DEVICE_NAME=$2 || DEVICE_NAME="WeatherStation"

    # request to create device
    CREATE_DEVICE_RESPONSE=$( curl \
    -X POST ${HOST}/device \
    -H "Authorization: Bearer $token" \
    -H 'Content-Type:application/json' \
    --silent \
    --write-out "HTTPSTATUS:%{http_code}" \
    -d ' {"templates" : [2, 3],
        "label" : "'${DEVICE_NAME}'"
    }' \
    2>/dev/null)
    
    # extract the status
    CREATE_DEVICE_STATUS=$(echo ${CREATE_DEVICE_RESPONSE} | tr -d '\n' | sed -E 's/.*HTTPSTATUS:([0-9]{3})$/\1/')

    # print message based on status
    if [ ! "${CREATE_DEVICE_STATUS}" -eq 200 ]; then
        echo "ERRO ON CREATE DEVICE: ${CREATE_DEVICE_RESPONSE}"
        exit
    fi
}


#### Main code ####

token=$(login $1 $2 $3)

templateId=$(createPropertiesTemplate http://localhost:8000 Device1)
echo "template id: ${templateId}"

#createTelemetryTemplate http://localhost:8000 Device1

#createDevice http://localhost:8000 Device1

#createTemperatureTemplate

#createTermometerDevice

#createWeatherStationDevice
