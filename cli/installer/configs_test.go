package installer

import (
	"os"
	"path"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestConfigs_Generate(t *testing.T) {
	outDir := t.TempDir()
	configs := NewConfigs(path.Join("..", "..", "config"), outDir)

	err := configs.Generate(Variables{
		AppDir:       "/snap/wishlist/current",
		DataDir:      "/var/snap/wishlist/current",
		CommonDir:    "/var/snap/wishlist/common",
		AppUrl:       "https://wishlist.example.com",
		AuthUrl:      "https://auth.example.com",
		ClientSecret: "secret",
	})
	assert.NoError(t, err)

	env, err := os.ReadFile(path.Join(outDir, "wishlist.env"))
	assert.NoError(t, err)
	assert.Contains(t, string(env), "\nDATABASE_URL=file:/var/snap/wishlist/current/wishlist.db\n")
	assert.Contains(t, string(env), "\nSOCKET_PATH=/var/snap/wishlist/current/wishlist.sock\n")
	assert.Contains(t, string(env), "\nORIGIN=https://wishlist.example.com\n")
	assert.Contains(t, string(env), "\nOIDC_DISCOVERY_URL=https://auth.example.com\n")
	assert.Contains(t, string(env), "\nOIDC_CLIENT_SECRET=secret\n")
	assert.NotContains(t, string(env), "{{")

	info, err := os.Stat(path.Join(outDir, "wishlist.env"))
	assert.NoError(t, err)
	assert.Equal(t, os.FileMode(0600), info.Mode().Perm())

	nginx, err := os.ReadFile(path.Join(outDir, "nginx.conf"))
	assert.NoError(t, err)
	assert.Contains(t, string(nginx), "listen unix:/var/snap/wishlist/common/web.socket;")
	assert.Contains(t, string(nginx), "server unix:/var/snap/wishlist/current/wishlist.sock;")
	assert.Contains(t, string(nginx), "alias /var/snap/wishlist/current/uploads/;")
}
