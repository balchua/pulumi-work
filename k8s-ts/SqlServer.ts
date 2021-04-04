import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";

export class SqlServer {
    private _name: string;
    private _image: string;
    private _namespace: string;
    private _pvName: string;
    private _pvcName: string;
    private _labels: {};
    private _containerPort: number;
    private _servicePort: number;
    private _protocol:string;
    private _secretName: pulumi.Output<string>;
    private _serviceName: pulumi.Output<string>;

     
    constructor(public podName: string, public imageName: string, public namespace: string, 
        public techTalksSecret: k8s.core.v1.Secret) {

        this._name = podName;
        this._image = imageName;
        this._pvName = "sqlserver-data";
        this._pvcName = "techtalksdb-data";
        this._labels = { app: this._name };
        this._containerPort = 1433;
        this._servicePort = 1433;
        this._protocol = "TCP";
        this._secretName = techTalksSecret.metadata.apply(spec => spec.name)
        

    }

    private setupContainerEnvironment () {   
        return [
            {
                name: "ACCEPT_EULA",
                value: "Y"
            },
            {
                name: "SA_PASSWORD",
                valueFrom: {
                    secretKeyRef: {
                        name: this._secretName,
                        key: "sapassword"
                    }
                }
            },
            {
                name: "MSSQL_PID",
                value: "Developer"
            }
        ]
    }

   
    private statefulSet(environment: any, pvc: k8s.core.v1.PersistentVolumeClaim ) {
        let pvcName = pvc.metadata.apply(metadata => metadata.name);
        return new k8s.apps.v1beta1.StatefulSet(this._name, {
            metadata: {
                namespace: this._namespace, 
                labels: this._labels
            },
            spec: {
                serviceName: this._name,
                replicas: 1,
                template: {
                    metadata: { labels: this._labels },
                    spec: { 
                        volumes: [
                            {                    
                                name: pvcName,
                                persistentVolumeClaim: {
                                    claimName: pvcName
                                }

                            }
                        ],
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
                            env: environment,
                            volumeMounts: [
                                {
                                    name: pvcName,
                                    mountPath: "/var/opt/mssql"
                                }

                            ]
                            
                        }
                        
        
                    ] }
                }
            }
        });
    }

    private service(workload: k8s.apps.v1beta1.StatefulSet ) {
        let config = new pulumi.Config();
        let isLocal = config.require("isLocal");
        const frontend = new k8s.core.v1.Service(this._name, {
            metadata: { 
                labels: workload.spec.apply(spec => spec.template.metadata.labels),
                namespace: workload.metadata.apply(spec => spec.namespace),
                name: workload.metadata.apply(spec => spec.name) 
                },
            spec: {
                type: isLocal === "true" ? "ClusterIP" : "LoadBalancer",
                ports: [
                    { 
                        port: this._servicePort, 
                        targetPort: this._containerPort, 
                        protocol: this._protocol 
                    }
                ],
                selector: this._labels
            }
        });
        this._serviceName = frontend.metadata.apply(metadata => metadata.name)
    }

    
    persistentVolumeClaim() {
        return new k8s.core.v1.PersistentVolumeClaim (this._pvcName, {
            metadata: {
                namespace: this._namespace
            },
            spec: {
                storageClassName: "manual",
                accessModes: ["ReadWriteOnce"],
                resources: {
                    requests: {
                        storage: "3Gi"
                    }
                }
            }

        })
    }
 
    persistentVolume() {
        let pv = new k8s.core.v1.PersistentVolume (this._pvName,{
            metadata: {
                name: "sqlserverpv",
                labels: {
                    type: "local"
                }
            },
            spec: {
                storageClassName: "manual",
                capacity: {
                    storage: "10Gi",
                },
                accessModes: [ "ReadWriteOnce" ],
                hostPath: {
                    path: "/tmp/sqlserver"
                }
                
            }
        })
    }

    serviceName() {
        return this._serviceName
    }

    apply() {
        this.persistentVolume()
        let pvc = this.persistentVolumeClaim()
        let env = this.setupContainerEnvironment();
        let sqlserverDb = this.statefulSet(env, pvc);
        this.service(sqlserverDb);
    }

}