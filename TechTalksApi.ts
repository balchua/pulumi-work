import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";

export class TechTalksApi {
    private _name: string;
    private _image: string;
    private _namespace: string;
    private _labels: {};
    private _containerPort: number;
    private _servicePort: number;
    private _protocol:string;
    private _secretName: pulumi.Output<string>;
    private _sqlServerServiceName: pulumi.Output<string>;
    private _serviceName: pulumi.Output<string>;

     
    constructor(public podName: string, public imageName: string, public namespace: string,
        public techTalksSecret: k8s.core.v1.Secret, public sqlServerServiceName: pulumi.Output<string>) {

        this._name = podName;
        this._image = imageName;
        this._labels = { app: this._name };
        this._containerPort = 8080;
        this._servicePort = 8080;
        this._protocol = "TCP";
        this._secretName = techTalksSecret.metadata.apply(spec => spec.name);
        this._sqlServerServiceName = sqlServerServiceName;
    }

    private sqlServerPassword () {
        return {
                name: "SA_PASSWORD",
                valueFrom: {
                    secretKeyRef: {
                        name: this._secretName,
                        key: "sapassword"
                    }
                }    
            }
    }

    private sqlServerHost() {            
        return {
                name: "SQLSERVER_HOST",
                value: this._sqlServerServiceName
            }
        
    }

    private setupContainerEnvironment () {
        let env = [
            this.sqlServerPassword(),
            this.sqlServerHost(),
            {
                name: "ASPNETCORE_URLS",
                value: "http://0.0.0.0:" + this._containerPort
            },
            {
                name: "ConnectionStrings__DefaultConnection",
                value: "Data Source=$(SQLSERVER_HOST);Initial Catalog=TechTalksDB;User Id=SA;Password=$(SA_PASSWORD);MultipleActiveResultSets=True"
            }
        ];

        return env;

    }

    private initContainers () {
        
        return {
            name: "init-data",
            image: "nileshgule/sqlclient",
            imagePullPolicy: "IfNotPresent",
            env: [
                this.sqlServerPassword(),
                this.sqlServerHost()
            ],
            command: [
                "sh", "-c", "/opt/mssql-tools/bin/sqlcmd -S $(SQLSERVER_HOST) -U sa -P $(SA_PASSWORD) -d master -i initialize-database.sql"
            ]
        }

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
                    spec: { 
                        initContainers: [ this.initContainers() ],
                        containers: [
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

    private service(techtalksApi: k8s.apps.v1beta1.Deployment ) {
        let config = new pulumi.Config();
        let isLocal = config.require("isLocal");
        const frontend = new k8s.core.v1.Service(this._name, {
            metadata: { 
                labels: techtalksApi.spec.apply(spec => spec.template.metadata.labels),
                namespace: techtalksApi.metadata.apply(spec => spec.namespace),
                name: techtalksApi.metadata.apply(spec => spec.name) 
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
        this._serviceName = frontend.metadata.apply(metadata => metadata.name);
    }

    serviceName() {
        return this._serviceName
    }

    apply() {
        let env = this.setupContainerEnvironment();
        let techtalksApi = this.deployment(env);
        this.service(techtalksApi);
    }

}