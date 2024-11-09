package subfns

import (
	"bufio"
	"image/gif"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"

	"github.com/hedgehog125/chetbox-place-video/constants"
	"github.com/hedgehog125/chetbox-place-video/intertypes"
)

func ReadGif(env *intertypes.Env) *gif.GIF {
	gifFile := downloadAndStoreGif(env)
	defer gifFile.Close()
	reader := bufio.NewReader(gifFile)

	decoded, err := gif.DecodeAll(reader)
	if err != nil {
		log.Fatalf("Couldn't decode GIF. Error:\n%v", err.Error())
	}
	return decoded
}
func downloadAndStoreGif(env *intertypes.Env) *os.File {
	cachedFilePath := filepath.Join(env.MOUNT_PATH, constants.GIF_FILENAME)

	cachedFile, err := os.Open(cachedFilePath)
	if err == nil {
		return cachedFile
	}

	resp, err := http.Get(env.GIF_URL)
	if err != nil {
		log.Fatalf("Couldn't fetch GIF. Error:\n%v", err.Error())
	}
	defer resp.Body.Close()
	cachedFile, err = os.Create(cachedFilePath)
	if err != nil {
		log.Fatalf("Couldn't create GIF file. Error:\n%v", err.Error())
	}

	_, err = io.Copy(cachedFile, resp.Body)
	if err != nil {
		log.Fatalf("Couldn't write all of GIF file. Error:\n%v", err.Error())
	}
	return cachedFile
}
