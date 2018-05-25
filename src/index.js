const { Plugin } = require("@lovejs/framework");

class MailjetPlugin extends Plugin {
    async registerServices(container, origin) {
        container.setParameter(`mailjet.key`, this.get("mailjet.key"));
        container.setParameter(`mailjet.secret`, this.get("mailjet.secret"));

        let mailjetDefaults = {};
        ["from", "from_addresses", "to", "cc", "bcc", "errors_reporting"].forEach(k => {
            if (this.get(k)) {
                mailjetDefaults[k] = this.get(k);
            }
        });
        container.setParameter(`mailjet.defaults`, mailjetDefaults);

        await container.loadDefinitions(__dirname + "/_framework/services/services.yml", origin);
    }
}

module.exports = MailjetPlugin;
