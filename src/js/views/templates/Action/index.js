import alt from '../../../alt';
import FActions from './FActions';

export const FormActions = alt.createActions(FActions);
export const AttrActions = alt.generateActions('set', 'update', 'add', 'remove');
