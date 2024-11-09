package main

import (
	"fmt"

	"github.com/hedgehog125/chetbox-place-video/subfns"
)

func main() {
	env := subfns.LoadEnvironmentVariables()
	decodedGif := subfns.ReadGif(env)

	fmt.Printf("decodedGif.Image[200].Pix: %v\n", decodedGif.Image[200].Pix)
}
