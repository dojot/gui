Feature('Profiles CRUD');

Before((login) => {
    login('admin');
});

function openPage(I) {
    I.click(locate('a').withAttr({ href: '#/groups' }));
}

Scenario('@basic: Creating a profile', (I) => {
    openPage(I);

    I.click(locate('div').withAttr({ title: 'Create a new profile' }));
    I.fillField('name', 'TesteProfile');
    I.wait(1);
    I.fillField('description', 'Teste Profile, contendo teste automatizado usando codecept - JavaScript');
    I.wait(1);
    I.checkOption('template.viewer');
    I.wait(1);
    I.checkOption('device.viewer');
    I.wait(1);
    I.checkOption('flows.viewer');
    I.wait(1);
    I.checkOption('history.viewer');
    I.wait(1);
    I.checkOption('user.viewer');
    I.wait(1);
    I.checkOption('ca.viewer');
    I.wait(1);
    I.checkOption('user.modifier');
    I.wait(1);
    I.checkOption('permission.modifier');
    I.wait(1);
    I.click('Save');

    // Checking message the reply
    I.wait(2);
    I.see('Profile created.');
});

Scenario('@basic: Checking create profile', (I) => {
    openPage(I);
    I.click('TesteProfile');
    I.wait(5);
    I.seeCheckboxIsChecked('template.viewer');
    I.wait(1);
    I.seeCheckboxIsChecked('device.viewer');
    I.wait(1);
    I.seeCheckboxIsChecked('flows.viewer');
    I.wait(1);
    I.seeCheckboxIsChecked('history.viewer');
    I.wait(1);
    I.seeCheckboxIsChecked('user.viewer');
    I.wait(1);
    I.seeCheckboxIsChecked('ca.viewer');
    I.wait(1);
    I.seeCheckboxIsChecked('user.modifier');
    I.wait(1);
    I.seeCheckboxIsChecked('permission.modifier');
});

Scenario('@basic: Updating a profile', (I) => {
    openPage(I);

    I.click('TesteProfile');
    I.wait(1);
    I.uncheckOption('user.viewer');
    I.wait(1);
    I.uncheckOption('ca.viewer');
    I.wait(1);
    I.uncheckOption('permission.modifier');
    I.wait(1);

    I.click('Save');
    // Checking message the reply
    I.wait(3);
    I.see('Profile updated.');
});

Scenario('@basic: ');

Scenario('@basic: Checking Update profile', (I) => {
    openPage(I);

    I.click('TesteProfile');
    I.wait(5);
    I.dontSeeCheckboxIsChecked('user.viewer');
    I.wait(1);
    I.dontSeeCheckboxIsChecked('ca.viewer');
    I.wait(1);
    I.dontSeeCheckboxIsChecked('permission.modifier');
    I.wait(1);
});

Scenario('@basic: Invalid characters', (I) => {
    openPage(I);

    I.click('TesteProfile');
    I.fillField('name', '--');
    I.fillField('description', 'Teste de Caracteres');
    I.click('Save');

    // Checking message the reply
    I.wait(3);
    I.see('Invalid group name, only alphanumeric allowed');
    I.click(locate('.footer button').withAttr({ title: 'Discard' }));
});

Scenario('@basic: Testing discard button', (I) => {
    openPage(I);

    I.click('TesteProfile');
    I.click(locate('.footer button').withAttr({ title: 'Discard' }));
});

Scenario('@basic: Remove profile, Button Cancel', (I) => {
    openPage(I);

    I.click('TesteProfile');
    I.click(locate('.footer button').withAttr({ title: 'Remove' }));
    I.click(locate('.confirm-modal button').withAttr({ title: 'Cancel' }));
    I.wait(2);
});

Scenario('@basic: Remove profile', (I) => {
    openPage(I);

    I.click('TesteProfile');
    I.click(locate('.footer button').withAttr({ title: 'Remove' }));
    I.click(locate('.confirm-modal button').withAttr({ title: 'Remove' }));

    // Checking message the reply
    I.wait(3);
    I.see('Profile removed');
});


Scenario('@basic: Creating a profile, description empty', (I) => {
    openPage(I);

    I.click(locate('div').withAttr({ title: 'Create a new profile' }));
    I.fillField('name', 'TesteDescricao');
    I.fillField('description', '');
    I.click('Save');

    I.wait(3);
    I.see('Empty Profile description.');
    I.click(locate('.footer button').withAttr({ title: 'Discard' }));
});

Scenario('@basic: Creating a profile, Name empty', (I) => {
    openPage(I);

    I.click(locate('div').withAttr({ title: 'Create a new profile' }));
    I.fillField('name', '');
    I.fillField('description', '');
    I.click('Save');

    I.wait(3);
    I.see('Empty Profile name.');
    I.click(locate('.footer button').withAttr({ title: 'Discard' }));
});

// ///////////////////////////////////////////////////////////
//  Teste de usuario e perfil, configurando permissições //
// //////////////////////////////////////////////////////////


// Feature('User Management');

// // Usar outro comando, comando não pratico caso mude o endereço IP
// Scenario('@basic: Open page User', async (I) => {
//     I.amOnPage('#/auth');
// });

// Scenario('@basic: Create a new user', async (I) => {
//     I.click(locate('input').withAttr({ title: 'userName46465' }));
//     I.fillField('userName46465', 'TestUser1');
// });
