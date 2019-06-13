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
    -d '
    {
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
    -d '
    {
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


createTemperatureTemplate() {
    # variables assignment
    [ ! -z "$1" ] && HOST=$1 || HOST="http://localhost:8000"

    # request to create template
    CREATE_TEMPERATURE_RESPONSE=$( curl \
    -X POST ${HOST}/template \
    -H "Authorization: Bearer $token" \
    -H "Content-Type:application/json" \
    --silent \
    -d '
    {
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
    
    # extract the template id
    TEMPLATE_ID=$(echo ${CREATE_TEMPERATURE_RESPONSE} | jq '.template.id' )

    # extract the status
    CREATE_TEMPLATE_RESULT=$(echo ${CREATE_TEMPERATURE_RESPONSE} | jq '.result' )

    # print message based on status
    if [ -z "${CREATE_TEMPLATE_RESULT}" ]; then
        echo "ERRO ON CREATE TEMPLATE: ${CREATE_TEMPERATURE_RESPONSE}"
        exit
    else 
        echo $TEMPLATE_ID
    fi
}


#### create devices ####
createDevice() {
    # variables assignment
    [ ! -z "$1" ] && HOST=$1 || HOST="http://localhost:8000"
    [ ! -z "$2" ] && DEVICE_NAME=$2 || DEVICE_NAME="D"
    [ ! -z "$3" ] && TEMPLATE1=$3 || TEMPLATE1=1
    [ ! -z "$4" ] && TEMPLATE2=$4 || TEMPLATE2=2

    # request to create device
    CREATE_DEVICE_RESPONSE=$( curl \
    -X POST ${HOST}/device \
    -H "Authorization: Bearer $token" \
    -H 'Content-Type:application/json' \
    --silent \
    -d '
    {
        "templates" : ['${TEMPLATE1}', '${TEMPLATE2}'],
        "label" : "'${DEVICE_NAME}'"
    }' \
    2>/dev/null)
        
    # extract the template id
    DEVICE_ID=$(echo ${CREATE_DEVICE_RESPONSE} | jq '.devices | .[0] | .id' )

    # extract the status
    CREATE_DEVICE_MESSAGE=$(echo ${CREATE_DEVICE_RESPONSE} | jq '.message' )

    # print message based on status
    if [ -z "${CREATE_DEVICE_MESSAGE}" ]; then
        echo "ERRO ON CREATE DEVICE: ${CREATE_DEVICE_RESPONSE}"
        exit
    else 
        echo $DEVICE_ID
    fi
}


#### create flow ####
createBasicFlow() {
    # variables assignment
    [ ! -z "$1" ] && HOST=$1 || HOST="http://localhost:8000"
    [ ! -z "$2" ] && FLOW_NAME=$2 || FLOW_NAME="Basic flow"
    [ ! -z "$3" ] && DEVICE1=$3 || echo "Device identifier not found" | exit
    [ ! -z "$4" ] && DEVICE2=$4 || echo "Device identifier not found" | exit
    [ ! -z "$5" ] && DEVICE3=$5 || echo "Device identifier not found" | exit

    # request to create a basic flow
    CREATE_FLOW_RESPONSE=$( curl \
    -X POST ${HOST}/flows/v1/flow \
    -H "Authorization: Bearer $token" \
    -H 'Content-Type:application/json' \
    --silent \
    -d '{
        "name":"'${FLOW_NAME}'",
        "flow":[
            {
                "id":"A38da0ec10754c2",
                "type":"tab",
                "label":"Fluxo 1"
            },
            {
                "id":"A920a88fb88b6a8",
                "type":"event device in",
                "z":"A38da0ec10754c2",
                "name":"D1",
                "event_configure":false,
                "event_publish":true,
                "device_id":'${DEVICE1}',
                "x":126.5,
                "y":44,
                "wires":[
                    [
                        "A2a3e9053e945f"
                    ]
                ]
            },
            {
                "id":"Adb2e6d109c239",
                "type":"event device in",
                "z":"A38da0ec10754c2",
                "name":"Termometer",
                "event_configure":false,
                "event_publish":true,
                "device_id":'${DEVICE2}',
                "x":129.5,
                "y":109,
                "wires":[
                    [
                        "A2a3e9053e945f"
                    ]
                ]
            },
            {
                "id":"A2a3e9053e945f",
                "type":"multi device out",
                "z":"A38da0ec10754c2",
                "name":"WeatherStation",
                "device_source":"configured",
                "devices_source_dynamic":"",
                "devices_source_dynamicFieldType":"msg",
                "devices_source_configured":[
                    '${DEVICE3}'
                ],
                "attrs":"payload.data.attrs",
                "_devices_loaded":true,
                "x":422.5,
                "y":40,
                "wires":[
                ]
            }
        ]
    }' \
    2>/dev/null)
    
    #echo $CREATE_FLOW_RESPONSE

    # extract the template id
    FLOW_ID=$(echo ${CREATE_FLOW_RESPONSE} | jq '.flow | .[0] | .id' )

    # extract the status
    CREATE_FLOW_MESSAGE=$(echo ${CREATE_FLOW_RESPONSE} | jq '.message' )

    # print message based on status
    if [ -z "${CREATE_FLOW_MESSAGE}" ]; then
        echo "ERRO ON CREATE DEVICE: ${CREATE_FLOW_RESPONSE}"
        exit
    else 
        echo $FLOW_ID
    fi
}


#### Publish messages ####
messagesPublisher() {
    # variables assignment
    [ ! -z "$1" ] && HOST=$1 || HOST="http://localhost:8000"
    [ ! -z "$2" ] && TENANT=$2 || TENANT=$2
    [ ! -z "$3" ] && DEVICE=$3 || echo "Device identifier not found" | exit
    [ ! -z "$4" ] && MESSAGE=$4 || echo "Empty message recipe" | exit

    #MESSAGE='{"rain":2.5,"humidity":73}'
    
    DEVICE_ID=$(echo $DEVICE | tr -d '"' )
    
    eval "mosquitto_pub -h ${HOST} -p 1883 -t /${TENANT}/${DEVICE_ID}/attrs -m '${MESSAGE}'"
}


#### Get History ####
getHistory() {
    # variables assignment
    [ ! -z "$1" ] && HOST=$1 || HOST="http://localhost:8000"
    [ ! -z "$2" ] && DEVICE_ID=$2 || echo "Device identifier not found" | exit

    GET_HISTORY_RESPONSE=$(curl \
    -X GET ${HOST}/history/device/${DEVICE_ID}/history?lastN=3 \
    -H "Authorization: Bearer $token" \
    -H "Content-Type:application/json" \
    --silent \
    2>/dev/null)

    echo $GET_HISTORY_RESPONSE
}



#### Main code ####

token=$(login $1:8000 $2 $3)

# propertiesTemplateIdD1=$(createPropertiesTemplate $1:8000 Device1)
# echo "Properties Template ID Device1: ${propertiesTemplateIdD1}"

# telemetryTemplateIdD1=$(createTelemetryTemplate $1:8000 Device1)
# echo "Telemetry Template ID Device1: ${telemetryTemplateIdD1}"

# device1Id=$(createDevice $1:8000 Device1 $propertiesTemplateIdD1 $telemetryTemplateIdD1)
# echo "Id Device1: ${device1Id}"

# temperatureTemplateId=$(createTemperatureTemplate $1:8000)
# echo "Temperature Template ID: ${temperatureTemplateId}"

# termometerId=$(createDevice $1:8000 Termometer $propertiesTemplateIdD1 $temperatureTemplateId)
# echo "Termometer Id: ${termometerId}"

# weatherStationId=$(createDevice $1:8000 WeatherStation $telemetryTemplateIdD1 $temperatureTemplateId)
# echo "Weather Station Id: ${weatherStationId}"

# basicFlowId=$(createBasicFlow $1:8000 WeatherStationFlow $device1Id $termometerId $weatherStationId )
# echo "Flow Id: ${basicFlowId}"

# messenger=$(messagesPublisher $1 $2 $device1Id '{"rain":2.5,"humidity":73}')
# messenger=$(messagesPublisher $1 $2 $device1Id '{"rain":0.5,"humidity":67}')
# messenger=$(messagesPublisher $1 $2 $device1Id '{"rain":0.3,"humidity":56}')
# messenger=$(messagesPublisher $1 $2 $device1Id '{"rain":0,"humidity":40}')
# messenger=$(messagesPublisher $1 $2 $device1Id '{"rain":1.35,"humidity":53}')

# messenger=$(messagesPublisher $1 $2 $termometerId '{"temperature":21}')
# messenger=$(messagesPublisher $1 $2 $termometerId '{"temperature":24}')
# messenger=$(messagesPublisher $1 $2 $termometerId '{"temperature":25}')
# messenger=$(messagesPublisher $1 $2 $termometerId '{"temperature":28}')

history=$(getHistory $1:8000 82f0fe)
echo $history
#mosquitto_pub -h 10.202.70.99 -p 1883 -t /admin/bd8368/attrs -m '{"rain":2.5,"humidity":73}'