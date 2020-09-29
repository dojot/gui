import templateManager from 'Comms/templates/TemplateManager';

class FActions {
    set(args) { return args; }

    update(args) { return args; }

    fetch(id) {
        return (dispatch) => {
            dispatch();
            templateManager.getTemplate(id)
                .then((d) => { this.set(d); })
                .catch((error) => { console.error('Failed to get template', error); });
        };
    }
}

export default FActions;
