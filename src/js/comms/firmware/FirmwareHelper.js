import i18n from 'i18next';
import {
    FW_RESULT_META_LABEL,
    FW_STATE_META_LABEL,
} from 'Comms/firmware/FirmwareMetasConst';

class FirmwareHelper {
    /**
     * Transform  state and result from firmware to full texts associated with status
     * @param metadata
     * @param listOfData Array with data received from history ou socketIO
     * @returns {null|Array}
     */
    transformStatusToFullTextStatus(metadata, listOfData) {
        function _transformValueToFullText(type) {
            return listOfData.map((data) => ({
                ...data,
                value: typeof data.value === 'number' ? `${i18n.t(`firmware:${type}.${data.value}`)} (${data.value})` : data.value,
            }));
        }

        if (metadata) {
            const result = metadata.filter((meta) => meta.label === FW_RESULT_META_LABEL);
            const state = metadata.filter((meta) => meta.label === FW_STATE_META_LABEL);

            if (result.length <= 0 && state.length <= 0) return null;

            let finalListOfData = [];
            if (result.length > 0) {
                finalListOfData = _transformValueToFullText('result');
            } else if (state.length > 0) {
                finalListOfData = _transformValueToFullText('state');
            }
            return finalListOfData;
        }
        return null;
    }
}

const fwHelper = new FirmwareHelper();
export default fwHelper;
