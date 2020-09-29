import { Ability } from '@casl/ability';
import Util from '../../comms/util/util';

const ability = new Ability(Util.getPermissions() != null ? Util.getPermissions() : []);

ability.canModify = (permission) => ability.can('modifier', permission);

ability.canView = (permission) => ability.can('viewer', permission)
    || ability.can('modifier', permission);

export class AbilityUtil {
    static loginPermissions(permissions) {
        ability.update(permissions);
        Util.setPermissions(permissions);
    }

    static logoff() {
        ability.update([]);
        Util.setPermissions([]);
    }
}

export default ability;
