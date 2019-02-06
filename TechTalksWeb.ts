import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";
import { specialArchiveSig } from "@pulumi/pulumi/runtime";
import { meta } from "@pulumi/kubernetes/types/input";

export class TechTalksWeb {
    private _name: string;
    private _image: string;
    private _namespace: string;
    private _techTalksApiUrl: pulumi.Output<string>;
    private _labels: {};
    private _containerPort: number;
    private _servicePort: number;
    private _protocol:string;
    private _frontendService: k8s.core.v1.Service;

     
    constructor(public podName: string, public imageName: string, public namespace: string, public techTalkApiService: pulumi.Output<string>) {

        this._name = podName;
        this._image = imageName;
        this._techTalksApiUrl = techTalkApiService.apply(name => "http://" + name + ":8080/api/techtalks/")
        this._labels = { app: this._name };
        this._containerPort = 80;
        this._servicePort = 80;
        this._protocol = "TCP";
    }

    private setupContainerEnvironment () {
        return [
            {
                name: "ASPNETCORE_ENVIRONMENT",
                value: "Development"
            },
            {
                name: "TechTalksAPIUrl",
                value: this._techTalksApiUrl
            }
        ]
    }

    private deployment(environment: any) {
        return new k8s.apps.v1beta1.Deployment(this._name, {
            metadata: {
                namespace: this._namespace, 
                labels: this._labels
            },
            spec: {
                selector: { matchLabels: this._labels },
                replicas: 1,
                template: {
                    metadata: { labels: this._labels },
                    spec: { containers: [
                        { 
                            name: this._name, 
                            image: this._image, 
                            ports: [
                              {
                                  containerPort: this._containerPort,
                                  protocol: this._protocol
                          
                               }
                            ],
                            env: environment
                        }
        
                    ] }
                }
            }
        });
    }

    private service(techtalksWeb: k8s.apps.v1beta1.Deployment ) {
        let config = new pulumi.Config();
        let isLocal = config.require("isLocal");
        this._frontendService = new k8s.core.v1.Service(this._name, {
            metadata: { 
                labels: techtalksWeb.spec.apply(spec => spec.template.metadata.labels),
                namespace: techtalksWeb.metadata.apply(spec => spec.namespace),
                name: techtalksWeb.metadata.apply(spec => spec.name) 
                },
            spec: {
                type: isLocal === "true" ? "ClusterIP" : "LoadBalancer",
                ports: [
                    { 
                        name: "http", 
                        port: this._servicePort, 
                        targetPort: this._containerPort, 
                        protocol: this._protocol 
                    }
                ],
                selector: this._labels
            }
        });
       
    }

    showDetails() {
        this._frontendService.metadata.apply(metadata => {
            console.log("Service Name: " + metadata.name)
        });

        this._frontendService.spec.apply(spec => {
            console.log("ClusterIP: " + spec.clusterIP)
        });
        
    }

    apply() {
        let env = this.setupContainerEnvironment();
        let techtalksWeb = this.deployment(env);
        this.service(techtalksWeb);
       
    }

}