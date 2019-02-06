import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";


export class TechTalksSecret {

    _secretName: string;
    _namespace: string;
    _secret: k8s.core.v1.Secret;

    constructor (public secretName: string, public namespace: string) {
        this._namespace = namespace;
        this._secretName = secretName;
    }

    getSecret() {
        return this._secret;
    }

    apply() {
        let config = new pulumi.Config();
        let saPassword = config.require("sapassword"); 
        this._secret = new k8s.core.v1.Secret(this._secretName, {
            metadata: {
                namespace: this._namespace,
            },
            type: "Opaque",
            data: {
                "sapassword": Buffer.from(saPassword).toString("base64")
            }
        })
    }

    
}