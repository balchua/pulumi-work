package main

import (
	"dogo/infra"

	"github.com/pulumi/pulumi/sdk/v2/go/pulumi"
)

func main() {
	pulumi.Run(func(ctx *pulumi.Context) error {

		node := infra.MicroK8sNode{
			Count:  2,
			Image:  "ubuntu-20-04-x64",
			Region: "sgp1",
			Size:   "s-2vcpu-4gb",
			Name:   "nero",
		}
		count := 2
		server, err := infra.CreateNodes(ctx, node)
		if err != nil {
			return err
		}

		for i := 0; i < count; i++ {
			// Export the resulting server's IP address and DNS name.
			ctx.Export("name", server[i].Name)
			ctx.Export("publicIp", server[i].Ipv4Address)
			ctx.Export("privateIp", server[i].Ipv4AddressPrivate)
		}

		return nil
	})
}
