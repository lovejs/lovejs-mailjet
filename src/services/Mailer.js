const _ = require("lodash");

class Mailer {
    constructor({ key, secret }, defaults) {
        this.key = key;
        this.secret = secret;
        this.defaults = defaults;
        _.defaults(this.defaults, {
            from: "default"
        });
    }

    getSender() {
        if (!this.sender) {
            const mailjet = require("node-mailjet");
            this.mailjet = mailjet.connect(
                this.key,
                this.secret,
                {
                    version: "v3.1"
                }
            );
            this.sender = this.mailjet.post("send");
        }

        return this.sender;
    }

    getAddress(type) {
        if (!type) {
            return false;
        }

        if (_.isPlainObject(type)) {
            return [type];
        }

        return type;
    }

    async send(config) {
        _.defaults(config, this.defaults);

        console.log("Sending with config: ", config);

        let { subject, text, html, template_id, template_vars, from, from_addresses, to, bcc, cc, error_reporting, headers } = config;

        console.log(from_addresses);

        if (!from_addresses || !from || !from_addresses[from]) {
            throw new Error(`Email error, missing from or from not found in from list`);
        }

        let email = {
            From: from_addresses[from],
            Subject: subject
        };

        const types = { to: "To", cc: "Cc", bcc: "Bcc" };
        for (let type in types) {
            const list = this.getAddress(config[type]);

            if (type === "to" && !list) {
                throw new Error(`Email error, the email must have at least someone in "To"`);
            }

            if (list) {
                const header = types[type];
                email[header] = list;
            }
        }

        if (text) {
            email["TextPart"] = text;
        }

        if (html) {
            email["HTMLPart"] = html;
        }

        if (template_id) {
            email["TemplateID"] = template_id;
            email["TemplateLanguage"] = true;

            if (template_vars) {
                email["Variables"] = template_vars;
            }

            if (error_reporting) {
                email["TemplateErrorReporting"] = error_reporting;
            }
        }

        console.log("Sending : ");
        console.log(email);

        try {
            const res = await this.getSender().request({ Messages: [email] });
            console.log("Result > ", res);
        } catch (e) {
            console.error("Error sending email : ");
            console.log(e);
            return false;
        }
    }
}

module.exports = Mailer;
