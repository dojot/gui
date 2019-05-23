import templateManager from 'Comms/templates';

class DeviceHandlerHelper {
    async getTemplatesByDevice(device) {
        const templates = [];
        const promises = [];
        device.templates.forEach((idTemplate) => {
            promises.push(templateManager.getTemplate(idTemplate)
                .then((template) => {
                    templates.push(template);
                }));
        });
        await Promise.all(promises);
        return templates;
    }

    /**
     * Remove all values of attrs and metas that it will be not specialized
     * comparing with templates
     *
     * @param device Object with all data of device
     * @param templates Array of templates that be associated with device
     *
     * @returns {*} new object with  all data of device  without not specialized  attr and metas.
     */
    diffTemAndSpecializedAttrsMetas(device, templates) {
        let specializedAttrs = [];
        const modifiedDevice = device;
        templates.forEach((template) => {
            if (template.attrs) {
                template.attrs.forEach((attrTem) => {
                    let specializedMetas = [];
                    let specializedStaticAttr = true;
                    const filteredAttr = modifiedDevice.attrs.filter((attrDev) => {
                        if (attrDev.id === attrTem.id
                            && attrDev.template_id === attrTem.template_id) {
                            specializedStaticAttr = attrDev.is_static_overridden
                                || this._isSpecializedStaticAttr(attrDev, attrTem);
                            specializedMetas = this._filterSpecializedMetas(attrTem, attrDev);
                            return specializedMetas.length > 0 || specializedStaticAttr;
                        }
                        return false;
                    });

                    if (filteredAttr[0]) {
                        const attrElement = filteredAttr[0];
                        if (attrElement) {
                            attrElement.metadata = specializedMetas;
                            if (!specializedStaticAttr) {
                                delete attrElement.static_value;
                            }
                        }
                    }

                    specializedAttrs = specializedAttrs.concat(filteredAttr);
                });
            }
        });
        specializedAttrs = this.removeRepeatElementsOnArray(specializedAttrs, 'id');
        modifiedDevice.attrs = specializedAttrs;
        
        return modifiedDevice;
    }

    removeRepeatElementsOnArray(arr, comp) {
        return arr
            .map(e => e[comp])

            // store the keys of the unique objects
            .map((e, i, final) => final.indexOf(e) === i && i)

            // eliminate the dead keys & store unique objects
            .filter(e => arr[e]).map(e => arr[e]);
    }

    _filterAttrFromOldDevice(oldDev, template, attrDev) {
        let oldAttr = null;
        if (oldDev && oldDev.attrs && oldDev.attrs[template.id]) {
            oldAttr = oldDev.attrs[template.id].filter(oldAttrDev => attrDev.id === oldAttrDev.id);
        }
        return oldAttr && oldAttr[0] ? oldAttr[0] : null;
    }

    _isSpecializedStaticAttr(attrDev, attrTemp) {
        let specializeStaticAttr = false;
        if ((attrDev.type !== 'dynamic' || attrDev.type !== 'actuator') && attrDev.static_value !== attrTemp.static_value) {
            specializeStaticAttr = true;
        }
        return specializeStaticAttr;
    }

    _filterSpecializedMetas(attrTemp, attrDev) {
        let specializedMetas = [];
        if (attrTemp.metadata && attrDev.metadata) {
            specializedMetas = attrDev.metadata.filter((metaDev) => {
                let specializeStaticMetaValue = false;
                attrTemp.metadata.forEach((metaTemp) => {
                    if (metaTemp.id === metaDev.id) {
                        if (metaTemp.static_value !== metaDev.static_value) {
                            specializeStaticMetaValue = true;
                        }
                        if (metaDev.is_static_overridden) {
                            specializeStaticMetaValue = true;
                        }
                    }
                });
                return specializeStaticMetaValue;
            });
        }
        return specializedMetas;
    }
}

const deviceHandlerHelper = new DeviceHandlerHelper();
export default deviceHandlerHelper;
