import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";
import {TechTalksWeb} from "./TechTalksWeb";
import {TechTalksApi} from "./TechTalksApi";
import {SqlServer} from "./SqlServer";
import {TechTalksSecret} from "./secrets"

let config = new pulumi.Config();
let namespace = config.require("namespace");

const secrets = new TechTalksSecret("sqlsecret",namespace);
secrets.apply();


const sqlserver = new SqlServer("mssql","microsoft/mssql-server-linux", namespace, secrets.getSecret() )
sqlserver.apply();

const techtalksApi = new TechTalksApi("techtalksapi","nileshgule/techtalksapi",namespace, secrets.getSecret(), sqlserver.serviceName())
techtalksApi.apply()

const techtalksWeb = new TechTalksWeb('techtalkweb', "nileshgule/techtalksweb:v1", namespace, techtalksApi.serviceName());
techtalksWeb.apply()
techtalksWeb.showDetails()




