
Feature('Profiles CRUD');

Before((login) => {
    login('admin');
});

function openPage(I) {
    I.click(locate('a').withAttr({ href: '#/groups' }));
}

Scenario('@basic: Creating a profile', async (I) => {
    openPage(I)

    I.click(locate('div').withAttr({ title: 'Create a new profile' }))
    I.fillField('name', 'TesteProfile')
    I.fillField('description', 'Teste Profile, contendo teste automatizado usando codecept - JavaScript')
    I.checkOption('template.viewer')
    I.checkOption('device.viewer')
    I.checkOption('flows.viewer')
    I.checkOption('history.viewer')
    I.checkOption('user.viewer')
    I.checkOption('ca.viewer')
    I.checkOption('user.modifier')
    I.checkOption('permission.modifier')
    I.click('Save')

    // Checking message the reply
    I.wait(3)
    I.see('Profile created.')
});

Scenario('@basic: Checking create profile', async (I) => {
    openPage(I)
    //I.click(locate('a').withAttr({ href: '#/groups' }));
    I.click('TesteProfile')

    I.seeCheckboxIsChecked('template.viewer')
    I.seeCheckboxIsChecked('device.viewer')
    I.seeCheckboxIsChecked('flows.viewer')
    I.seeCheckboxIsChecked('history.viewer')
    I.seeCheckboxIsChecked('user.viewer')
    I.seeCheckboxIsChecked('ca.viewer')
    I.seeCheckboxIsChecked('user.modifier')
    I.seeCheckboxIsChecked('permission.modifier')
});

Scenario('@basic: Updating a profile', async (I) => {
    // I.click(locate('a').withAttr({ href: '#/groups' }));
    openPage(I)

    I.click('TesteProfile')
    I.uncheckOption('user.viewer')
    I.uncheckOption('ca.viewer')
    I.uncheckOption('permission.modifier')

    I.click('Save')
    // Checking message the reply
    I.wait(3)
    I.see('Profile updated.')
});

Scenario('@basic: ')

Scenario('@basic: Checking Update profile', async (I) => {
    openPage(I)

    I.click('TesteProfile')
    I.dontSeeCheckboxIsChecked('user.viewer')
    I.dontSeeCheckboxIsChecked('ca.viewer')
    I.dontSeeCheckboxIsChecked('permission.modifier')
});

Scenario('@basic: Invalid characters', async (I) => {
    openPage(I)

    I.click('TesteProfile')
    I.fillField('name', '--')
    I.fillField('description', 'Teste de Caracteres')
    I.click('Save')

    // Checking message the reply
    I.wait(3)
    I.see('Invalid group name, only alphanumeric allowed')
    I.click(locate('.footer button').withAttr({ title: "Discard" }))
});

Scenario('@basic: Testing discard button', async (I) => {
    openPage(I)

    I.click('TesteProfile')
    I.click(locate('.footer button').withAttr({ title: "Discard" }))
});

Scenario('@basic: Remove profile, Button Cancel', async (I) => {
    openPage(I)

    I.click('TesteProfile')
    I.click(locate('.footer button').withAttr({ title: "Remove" }))
    I.click(locate('.confirm-modal button').withAttr({ title: "Cancel" }))
    I.wait(2)
});

Scenario('@basic: Remove profile', async (I) => {
    openPage(I)

    I.click('TesteProfile')
    I.click(locate('.footer button').withAttr({ title: "Remove" }))
    I.click(locate('.confirm-modal button').withAttr({ title: "Remove" }))

    // Checking message the reply
    I.wait(3)
    I.see('Profile removed')
});


Scenario('@basic: Creating a profile, description empty', async (I) => {
    openPage(I)

    I.click(locate('div').withAttr({ title: 'Create a new profile' }))
    I.fillField('name', 'TesteDescricao')
    I.fillField('description', '')
    I.click('Save')

    I.wait(3)
    I.see('Empty Profile description.')
    I.click(locate('.footer button').withAttr({ title: "Discard" }))
});


Scenario('@basic: Creating a profile, Name empty', async (I) => {
    openPage(I)

    I.click(locate('div').withAttr({ title: 'Create a new profile' }))
    I.fillField('name', '')
    I.fillField('description', '')
    I.click('Save')

    I.wait(3)
    I.see('Empty Profile name.')
    I.click(locate('.footer button').withAttr({ title: "Discard" }))
});

/////////////////////////////////////////////////////////////
//  Teste de usuario e perfil, configurando permissições //
////////////////////////////////////////////////////////////


Feature('User Management');

//Usar outro comando, comando não pratico caso mude o endereço IP
Scenario('@basic: Open page User', async (I) => {
    I.amOnPage('http://10.4.2.154:8000/#/auth');
});

Scenario('@basic: Create a new user', async (I) => {

    I.click(locate('input').withAttr({ title: 'userName46465' }));
    I.fillField('userName46465', 'TestUser1')
});
