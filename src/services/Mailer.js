const _ = require("lodash");

class Mailer {
    constructor(enabled, { key, secret }, defaults) {
        this.enabled = enabled;
        this.key = key;
        this.secret = secret;
        this.defaults = defaults;
        _.defaults(this.defaults, {
            from: "default"
        });
    }

    getMailjet() {
        if (!this.mailjet) {
            const mailjet = require("node-mailjet");
            this.mailjet = mailjet.connect(
                this.key,
                this.secret,
                {
                    version: "v3.1"
                }
            );
        }

        return this.mailjet;
    }

    getSender() {
        if (!this.sender) {
            this.sender = this.getMailjet().post("send");
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

        let {
            subject,
            text,
            html,
            template_id,
            template_vars,
            from,
            from_addresses,
            to,
            bcc,
            cc,
            error_reporting,
            headers,
            attachments
        } = config;

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

        if (attachments && attachments.length > 0) {
            email.Attachments = attachments;
        }

        try {
            if (this.enabled) {
                const res = await this.getSender().request({ Messages: [email] });
            } else {
                console.log("Mailjet mailer is not enabled");
            }
        } catch (e) {
            console.error("Error sending email : ");
            console.log(e);
            return false;
        }
    }
}

module.exports = Mailer;
