package subfns

import (
	"github.com/hedgehog125/chetbox-place-video/intertypes"
	"github.com/hedgehog125/chetbox-place-video/util"
	"github.com/joho/godotenv"
)

func LoadEnvironmentVariables() *intertypes.Env {
	_ = godotenv.Load(".env")

	env := intertypes.Env{
		MOUNT_PATH: util.RequireEnv("MOUNT_PATH"),
		GIF_URL:    util.RequireEnv("GIF_URL"),
	}
	return &env
}
