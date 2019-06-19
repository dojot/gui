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
        echo "ERROR ON CREATE TEMPLATE: ${CREATE_TEMPLATE_RESPONSE}"
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
            },
            {
                "label": "display",
                "static_value": "",
                "type": "actuator",
                "value_type": "string"
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
        echo "ERROR ON CREATE TEMPLATE: ${CREATE_TEMPLATE_RESPONSE}"
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
        echo "ERROR ON CREATE TEMPLATE: ${CREATE_TEMPERATURE_RESPONSE}"
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
        echo "ERROR ON CREATE DEVICE: ${CREATE_DEVICE_RESPONSE}"
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
    FLOW_ID=$(echo ${CREATE_FLOW_RESPONSE} | jq '.flow | .id' )

    # extract the status
    CREATE_FLOW_MESSAGE=$(echo ${CREATE_FLOW_RESPONSE} | jq '.message' )

    # print message based on status
    if [ -z "${CREATE_FLOW_MESSAGE}" ]; then
        #echo "ERROR ON CREATE DEVICE: ${CREATE_FLOW_RESPONSE}"
        exit
    else 
        echo $FLOW_ID
    fi
}


#### create flow ####
createActuatorFlow() {
    # variables assignment
    [ ! -z "$1" ] && HOST=$1 || HOST="http://localhost:8000"
    [ ! -z "$2" ] && FLOW_NAME=$2 || FLOW_NAME="Actuation flow"
    [ ! -z "$3" ] && DEVICE1=$3 || echo "Device identifier not found" | exit

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
                "id":"Ab51aaac1c31828",
                "type":"tab",
                "label":"Fluxo 1"
            },
            {
                "id":"A4e307abd4a0124",
                "type":"event device in",
                "z":"Ab51aaac1c31828",
                "name":"Hygrometer",
                "event_configure":false,
                "event_publish":true,
                "device_id":'${DEVICE1}',
                "x":86.5,
                "y":64,
                "wires":[
                    [
                        "A225818903a45f8"
                    ]
                ]
            },
            {
                "id":"A225818903a45f8",
                "type":"switch",
                "z":"Ab51aaac1c31828",
                "name":"Humidity %",
                "property":"payload.data.attrs.humidity",
                "propertyType":"msg",
                "rules":[
                    {
                        "t":"lt",
                        "v":"45",
                        "vt":"num"
                    }
                ],
                "checkall":"false",
                "outputs":1,
                "x":297.5,
                "y":150,
                "wires":[
                    ["A880cf0787c6a4"]
                ]
            },
            {
                "id":"A880cf0787c6a4",
                "type":"change",
                "z":"Ab51aaac1c31828",
                "name":"Alerta",
                "rules":[
                    {
                        "t":"set",
                        "p":"saida.display",
                        "pt":"msg",
                        "to":"Tempo seco! Evite Atividades físicas ao ar livre.",
                        "tot":"str"
                    }
                ],
                "action":"",
                "property":"",
                "from":"",
                "to":"",
                "reg":false,
                "x":453.5,
                "y":247,
                "wires":[
                    [
                        "A157376bcecae59"
                    ]
                ]
            },
            {
                "id":"A157376bcecae59",
                "type":"multi actuate",
                "z":"Ab51aaac1c31828",
                "name":"Display",
                "device_source":"self",
                "devices_source_dynamic":"",
                "devices_source_dynamicFieldType":"msg",
                "devices_source_configured":[""],
                "attrs":"saida",
                "_devices_loaded":true,
                "x":676.5,
                "y":317,
                "wires":[]
            }
        ]
    }' \
    2>/dev/null)
    
    #echo $CREATE_FLOW_RESPONSE

    # extract the template id
    FLOW_ID=$(echo ${CREATE_FLOW_RESPONSE} | jq '.flow | .id' )

    # extract the status
    CREATE_FLOW_MESSAGE=$(echo ${CREATE_FLOW_RESPONSE} | jq '.message' )

    # print message based on status
    if [ -z "${CREATE_FLOW_MESSAGE}" ]; then
        echo "ERROR ON CREATE DEVICE: ${CREATE_FLOW_RESPONSE}"
        exit
    else 
        echo $FLOW_ID
    fi
}



#### create flow ####
createNotificationFlow() {
    # variables assignment
    [ ! -z "$1" ] && HOST=$1 || HOST="http://localhost:8000"
    [ ! -z "$2" ] && FLOW_NAME=$2 || FLOW_NAME="Notification flow"
    [ ! -z "$3" ] && DEVICE1=$3 || echo "Device identifier not found" | exit

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
                "id":"A72c07e54bcf58",
                "type":"tab",
                "label":"Fluxo 1"
            },
            {
                "id":"A3a45957906e36a",
                "type":"event device in",
                "z":"A72c07e54bcf58",
                "name":"Termômetro",
                "event_configure":false,
                "event_publish":true,
                "device_id":'${DEVICE1}',
                "x":112.5,
                "y":79,
                "wires":[
                    [
                        "A81862d0e54a07"
                    ]
                ]
            },
            {
                "id":"A81862d0e54a07",
                "type":"switch",
                "z":"A72c07e54bcf58",
                "name":"Alerta temperatura",
                "property":"payload.data.attrs.temperature",
                "propertyType":"msg",
                "rules":[
                    {
                        "t":"gt","v":"32","vt":"num"
                    }
                ],
                "checkall":"false",
                "outputs":1,
                "x":335.5,
                "y":146,
                "wires":[
                    [
                        "A73ec539051f47c"
                    ]
                ]
            },
            {
                "id":"A73ec539051f47c",
                "type":"template",
                "z":"A72c07e54bcf58",
                "name":"Alerta de calor",
                "field":"notification",
                "fieldType":"msg",
                "syntax":"handlebars",
                "template":"{\"metadata\":{\"priority\":\"low\"},\"message\":\"Beba muito líquido\"}",
                "output":"json",
                "x":578.5,
                "y":234,
                "wires":[
                    [
                        "A377ec7c9094378"
                    ]
                ]
            },
            {
                "id":"A377ec7c9094378",
                "type":"notification",
                "z":"A72c07e54bcf58",
                "name":"",
                "source":"notification.metadata",
                "sourceFieldType":"msg",
                "messageDynamic":"notification.message",
                "messageStatic":"",
                "messageFieldType":"msg",
                "msgType":"dynamic",
                "x":789.5,
                "y":333,
                "wires":[]
            }
        ]
    }' \
    2>/dev/null)
    
    #echo $CREATE_FLOW_RESPONSE

    # extract the template id
    FLOW_ID=$(echo ${CREATE_FLOW_RESPONSE} | jq '.flow | .id' )

    # extract the status
    CREATE_FLOW_MESSAGE=$(echo ${CREATE_FLOW_RESPONSE} | jq '.message' )

    # print message based on status
    if [ -z "${CREATE_FLOW_MESSAGE}" ]; then
        echo "ERROR ON CREATE DEVICE: ${CREATE_FLOW_RESPONSE}"
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

    DEVICE_ID=$(echo $DEVICE | tr -d '"' )

    # echo "mosquitto_pub -h ${HOST} -p 1883 -t /${TENANT}/${DEVICE_ID}/attrs -m '${MESSAGE}'"

    eval "mosquitto_pub -h ${HOST} -p 1883 -t /${TENANT}/${DEVICE_ID}/attrs -m '${MESSAGE}' -d -k 10"
}


#### Get History ####
getHistory() {
    # variables assignment
    [ ! -z "$1" ] && HOST=$1 || HOST="http://localhost:8000"
    [ ! -z "$2" ] && DEVICE=$2 || echo "Device identifier not found" | exit

    DEVICE_ID=$(echo $DEVICE | tr -d '"' )
    
    #echo "URL: ${HOST}/history/device/${DEVICE}/history?lastN=3"

    GET_HISTORY_RESPONSE=$(curl \
    -X GET ${HOST}:8000/history/device/${DEVICE_ID}/history \
    -H "Authorization: Bearer $token" \
    -H "Content-Type:application/json" \
    --silent \
    2>/dev/null)

    echo $GET_HISTORY_RESPONSE
}


#### Open SocketIO ####
openSocketioConnection() {
    # variables assignment
    [ ! -z "$1" ] && HOST=$1 || HOST="http://localhost:8000"

    
    #echo "URL: ${HOST}/history/device/${DEVICE}/history?lastN=3"

    OPEN_SOCKETIO_RESPONSE=$(curl \
    -X GET ${HOST}/stream/socketio \
    -H "Authorization: Bearer $token" \
    -H "Content-Type:application/json" \
    -H "Connection:keep-alive" \
    2>/dev/null)

    echo $OPEN_SOCKETIO_RESPONSE
}


#### Delete Device ####
deleteDevice() {
    # variables assignment
    [ ! -z "$1" ] && HOST=$1 || HOST="http://localhost:8000"
    [ ! -z "$2" ] && DEVICE=$2 || DEVICE="ID not found."

    DEVICE_ID=$(echo $DEVICE | tr -d '"' )

    DELETE_TEST=$(curl \
    -X DELETE ${HOST}:8000/device/${DEVICE_ID} \
    -H "Authorization: Bearer $token" \
    -H "Content-Type:application/json" \
    -H "Connection:keep-alive" \
    2>/dev/null)

    echo $DELETE_TEST
}

#### Delete Template ####
deleteTemplate() {
    # variables assignment
    [ ! -z "$1" ] && HOST=$1 || HOST="http://localhost:8000"
    [ ! -z "$2" ] && TEMPLATE=$2 || TEMPLATE="ID not found."

    TEMPLATE_ID=$(echo $TEMPLATE | tr -d '"' )

    DELETE_TEST=$(curl \
    -X DELETE ${HOST}:8000/template/${TEMPLATE_ID} \
    -H "Authorization: Bearer $token" \
    -H "Content-Type:application/json" \
    -H "Connection:keep-alive" \
    2>/dev/null)

    echo $DELETE_TEST
}


#### Delete Flow ####
deleteFlow() {
    # variables assignment
    [ ! -z "$1" ] && HOST=$1 || HOST="http://localhost:8000"
    [ ! -z "$2" ] && FLOW=$2 || FLOW="ID not found."


    FLOW_ID=$(echo $FLOW | tr -d '"' )


    DELETE_TEST=$(curl \
    -X DELETE ${HOST}:8000/flows/v1/flow/${FLOW_ID} \
    -H "Authorization: Bearer $token" \
    -H "Content-Type:application/json" \
    -H "Connection:keep-alive" \
    2>/dev/null)

    echo $DELETE_TEST
}

deleteAllDevices() {
    deleteDevice=$(deleteDevice $1 $2)
    echo ${deleteDevice}
    deleteDevice=$(deleteDevice $1 $3)
    echo ${deleteDevice}
    deleteDevice=$(deleteDevice $1 $4)
    echo ${deleteDevice}
}


deleteAllTemplates() {
    deleteTemplate=$(deleteTemplate $1 $2)
    echo ${deleteTemplate}
    deleteTemplate=$(deleteTemplate $1 $3)
    echo ${deleteTemplate}
    deleteTemplate=$(deleteTemplate $1 $4)
    echo ${deleteTemplate}
}


#### Main code ####
clear
HOST="$1:8000"
echo "Login on Dojot...\n"

token=$(login ${HOST} $2 $3)

echo "\nCreating templates.."

propertiesTemplateIdD1=$(createPropertiesTemplate ${HOST} Device1)
if [ "$propertiesTemplateIdD1" -gt 0 ]; then
    echo "Properties Template OK!"
else
    echo "Problem to create template: ${propertiesTemplateIdD1}\n"
    echo "Error to test Dojot instalation"
    exit
fi
#echo "Properties Template ID Device1: ${propertiesTemplateIdD1}"

telemetryTemplateIdD1=$(createTelemetryTemplate ${HOST} Device1)
if [ "$telemetryTemplateIdD1" -gt 0 ]; then
    echo "Telemetry Template OK!"
else
    echo "Problem to create template: ${telemetryTemplateIdD1}\n"
    echo "Error to test Dojot instalation"
    exit
fi
#echo "Telemetry Template ID Device1: ${telemetryTemplateIdD1}"

temperatureTemplateId=$(createTemperatureTemplate ${HOST})
if [ "$temperatureTemplateId" -gt 0 ]; then
    echo "Temperature Template OK!\n"
else
    echo "Problem to create template: ${temperatureTemplateId}\n"
    echo "Error to test Dojot instalation"
    exit
fi
#echo "Temperature Template ID Device1: ${temperatureTemplateId}"

echo "\nInstantiating devices..."

device1Id=$(createDevice ${HOST} Device1 $propertiesTemplateIdD1 $telemetryTemplateIdD1)
if [ ${#device1Id} -eq 8 ]; then
    echo "Device 1 OK!"
else
    echo "Problem to create device. Reseting Dojot...\n"
    
    HOST=$1
    deleteTemplates=$(deleteAllTemplates ${HOST} $propertiesTemplateIdD1 $telemetryTemplateIdD1 $temperatureTemplateId)
    deletedTemplate=$(echo ${deleteTemplates} | jq '.result')

    exit
fi
#echo ${device1Id}

termometerId=$(createDevice ${HOST} Termometer $propertiesTemplateIdD1 $temperatureTemplateId)
if [ ${#termometerId} -eq 8 ]; then
    echo "Termometer Device OK!"
else
    echo "Problem to create device. Reseting Dojot...\n"
    
    HOST=$1
    deleteDevice=$(deleteDevice ${HOST} $device1Id)
    deletedDevice=$(echo ${deleteDevice} | jq '.result')

    deleteTemplates=$(deleteAllTemplates ${HOST} $propertiesTemplateIdD1 $telemetryTemplateIdD1 $temperatureTemplateId)
    deletedTemplate=$(echo ${deleteTemplates} | jq '.result')

    exit
fi
#echo ${termometerId}

weatherStationId=$(createDevice ${HOST} WeatherStation $telemetryTemplateIdD1 $temperatureTemplateId)
if [ ${#weatherStationId} -eq 8 ]; then
    echo "Weather Station Device OK!\n"
else
    echo "Problem to create device. Reseting Dojot...\n"

    HOST=$1
    deleteDevice=$(deleteDevice ${HOST} $device1Id)
    deletedDevice=$(echo ${deleteDevice} | jq '.result')

    deleteDevice=$(deleteDevice ${HOST} $termometerId)
    deletedDevice=$(echo ${deleteDevice} | jq '.result')

    deleteTemplates=$(deleteAllTemplates ${HOST} $propertiesTemplateIdD1 $telemetryTemplateIdD1 $temperatureTemplateId)
    deletedTemplate=$(echo ${deleteTemplates} | jq '.result')

    exit
fi
#echo ${weatherStationId}

sleep 1

echo "\nConfiguring flows..."

basicFlowId=$(createBasicFlow ${HOST} WeatherStationFlow $device1Id $termometerId $weatherStationId)
if [ ${#basicFlowId} -eq 38 ]; then
    echo "Basic Flow OK!"
else
    echo "Problem to create Basic flow. Reseting Dojot...\n"
    
    HOST=$1
    deleteDevices=$(deleteAllDevices ${HOST} $device1Id $termometerId $weatherStationId)
    #echo $deletedDevices
    deletedDevice=$(echo ${deleteDevices} | jq '.result')

    deleteTemplates=$(deleteAllTemplates ${HOST} $propertiesTemplateIdD1 $telemetryTemplateIdD1 $temperatureTemplateId)
    #echo $deleteTemplates
    deletedTemplate=$(echo ${deleteTemplates} | jq '.result')

    exit
fi
#echo ${basicFlowId}

sleep 1

actuatorFlowId=$(createActuatorFlow ${HOST} ActuationFlow $device1Id)
if [ ${#actuatorFlowId} -eq 38 ]; then
    echo "Actuator Flow OK!"
else
    echo "Problem to create Actuator flow. Reseting Dojot...\n"
    
    HOST=$1
    deleteDevices=$(deleteAllDevices ${HOST} $device1Id $termometerId $weatherStationId)
    deletedDevice=$(echo ${deleteDevices} | jq '.result')

    deleteTemplates=$(deleteAllTemplates ${HOST} $propertiesTemplateIdD1 $telemetryTemplateIdD1 $temperatureTemplateId)
    deletedTemplate=$(echo ${deleteTemplates} | jq '.result')

    deleteFlow=$(deleteFlow ${HOST} $basicFlowId)
    
    echo "Deleting flow ${deleteFlow}"
    exit
fi
#echo ${actuatorFlowId}

sleep 1

notificationFlowId=$(createNotificationFlow ${HOST} NotificationFlow $termometerId)
if [ ${#notificationFlowId} -eq 38 ]; then
    echo "Notification Flow OK!\n"
else
    echo "Problem to create Notification flow. Reseting Dojot...\n"
    
    HOST=$1
    deleteDevices=$(deleteAllDevices ${HOST} $device1Id $termometerId $weatherStationId)
    deletedDevice=$(echo ${deleteDevices} | jq '.result')

    deleteTemplates=$(deleteAllTemplates ${HOST} $propertiesTemplateIdD1 $telemetryTemplateIdD1 $temperatureTemplateId)
    deletedTemplate=$(echo ${deleteTemplates} | jq '.result')

    deleteFlow=$(deleteFlow ${HOST} $basicFlowId)
    echo "Restoring flow ${deleteFlow}"
    deleteFlow=$(deleteFlow ${HOST} $actuatorFlowId)
    echo "Restoring flow ${deleteFlow}"
    
    echo "Error to test Dojot instalation"
    exit
fi
#echo ${notificationFlowId}

echo "\nOpening a SocketIO connection..."

socketioConnection=$(openSocketioConnection ${HOST})
socketioToken=$(echo ${socketioConnection} | jq '.token')
if [ ${#socketioToken} -eq 38 ]; then
    echo "SocketIO connection opened OK!\n"
else
    echo "Problem to open SocketIO connection: ${socketioToken}\n"
    exit
fi
#echo ${socketioToken}
sleep 1

HOST=$1

echo "\nPublishing messages to devices..."

messenger=$(messagesPublisher ${HOST} $2 $termometerId '{"temperature":21}')
echo $messenger

sleep 1

messenger=$(messagesPublisher ${HOST} $2 $termometerId '{"temperature":24}')
messenger=$(messagesPublisher ${HOST} $2 $termometerId '{"temperature":35}')
messenger=$(messagesPublisher ${HOST} $2 $termometerId '{"temperature":28}')

sleep 1

messenger=$(messagesPublisher ${HOST} $2 $device1Id '{"rain":2.5,"humidity":73}')
messenger=$(messagesPublisher ${HOST} $2 $device1Id '{"rain":0.5,"humidity":67}')
messenger=$(messagesPublisher ${HOST} $2 $device1Id '{"rain":0.3,"humidity":46}')
messenger=$(messagesPublisher ${HOST} $2 $device1Id '{"rain":0,"humidity":40}')
messenger=$(messagesPublisher ${HOST} $2 $device1Id '{"rain":1.35,"humidity":53}')

sleep 2


echo "\nRetrieving history from device..."

history=$(getHistory ${HOST} ${device1Id})
historyResponse=$(echo ${history} | jq '.rain | .[0] | .attr')
if [ ${#historyResponse} -eq 6 ]; then
    echo "History retrieved OK!\n"
else
    historyError=$(echo ${history} | jq '.title')
    echo "Problem to retrieve History: ${historyError}\n"

    HOST=$1
    deleteDevices=$(deleteAllDevices ${HOST} $device1Id $termometerId $weatherStationId)
    deletedDevice=$(echo ${deleteDevices} | jq '.result')

    deleteTemplates=$(deleteAllTemplates ${HOST} $propertiesTemplateIdD1 $telemetryTemplateIdD1 $temperatureTemplateId)
    deletedTemplateResult=$(echo ${deleteTemplates} | jq '.result')
    #echo ${deletedTemplateResult}

    deleteFlow=$(deleteFlow ${HOST} $basicFlowId)
    deleteFlowResult=$(echo ${deleteFlow} | jq '.result')
    #echo ${deleteFlowResult}
    deleteFlow=$(deleteFlow ${HOST} $actuatorFlowId)
    deleteFlowResult=$(echo ${deleteFlow} | jq '.result')
    #echo ${deleteFlowResult}
    deleteFlow=$(deleteFlow ${HOST} $notificationFlowId)
    deleteFlowResult=$(echo ${deleteFlow} | jq '.result')
    #echo ${deleteFlowResult}
    
    echo "Error to test Dojot instalation"

    exit
fi
#echo "${historyResponse}\n"

deleteDevice=$(deleteDevice ${HOST} $device1Id)
#echo "Delete what was created: ${deleteTest}"

deleteDevice=$(deleteDevice ${HOST} $termometerId)
#echo "Delete what was created: ${deleteTest}"

deleteDevice=$(deleteDevice ${HOST} $weatherStationId)
#echo "Delete what was created: ${deleteTest}"

deleteTemplate=$(deleteTemplate ${HOST} $propertiesTemplateIdD1)
#echo "Delete what was created: ${deleteTest}"

deleteTemplate=$(deleteTemplate ${HOST} $temperatureTemplateId)
#echo "Delete what was created: ${deleteTest}"

deleteTemplate=$(deleteTemplate ${HOST} $telemetryTemplateIdD1)
#echo "Delete what was created: ${deleteTest}"

deleteFlow=$(deleteFlow ${HOST} $basicFlowId)
#echo "Delete what was created: ${deleteTest}"

deleteFlow=$(deleteFlow ${HOST} $actuatorFlowId)
#echo "Delete what was created: ${deleteTest}"

deleteFlow=$(deleteFlow ${HOST} $notificationFlowId)
#echo "Delete what was created: ${deleteTest}"

echo "Dojot installed with success!"

#http://localhost:8000/device/5e6256

#http://localhost:8000/template/24

#http://localhost:8000/flows/v1/flow/0bb87b93-a9a5-4357-934e-cef548a059b4

#./freshInstallTest.sh 172.18.0.1 admin admin
