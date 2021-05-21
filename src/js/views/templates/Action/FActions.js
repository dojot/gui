import templateManager from 'Comms/templates/TemplateManager';
import toaster from 'Comms/util/materialize';

class FActions {
    set(args) { return args; }

    update(args) { return args; }

    fetch(id) {
        return (dispatch) => {
            dispatch();
            templateManager.getTemplate(id)
                .then((d) => { this.set(d); })
                .catch((error) => {
                    toaster.error(`Failed to get template: ${JSON.stringify(error)}`);
                });
        };
    }
}

export default FActions;
