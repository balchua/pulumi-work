package infra

import (
	"fmt"
	"os"

	do "github.com/pulumi/pulumi-digitalocean/sdk/v2/go/digitalocean"
	"github.com/pulumi/pulumi/sdk/v2/go/pulumi"
)

type Node struct {
	Count  int
	Name   string
	Image  string
	Region string
	Size   string
}

func CreateNodes(ctx *pulumi.Context, node Node) ([]do.Droplet, error) {

	nodes := []do.Droplet{}
	for i := 0; i < node.Count; i++ {
		testNode, err := do.NewDroplet(ctx, fmt.Sprintf("%s-%d", "test", i), &do.DropletArgs{
			Image:   pulumi.String(node.Image),
			Region:  pulumi.String(node.Region),
			Size:    pulumi.String(node.Size),
			SshKeys: sshKeys(),
			Name:    pulumi.String(fmt.Sprintf("%s-%d", node.Name, i)),
		})
		nodes = append(nodes, *testNode)
		if err != nil {
			return nil, err
		}

	}
	return nodes, nil
}

func sshKeys() pulumi.StringArray {
	ssh := os.Getenv("TF_VAR_digitalocean_ssh_fingerprint")
	return pulumi.StringArray{
		pulumi.String(ssh),
	}
}
