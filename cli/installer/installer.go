package installer

import (
	"fmt"
	"path"

	"github.com/syncloud/golib/linux"
	"github.com/syncloud/golib/platform"
	"go.uber.org/zap"
)

const (
	App       = "wishlist"
	AppDir    = "/snap/wishlist/current"
	DataDir   = "/var/snap/wishlist/current"
	CommonDir = "/var/snap/wishlist/common"
	OIDCRedirect = "/login"
)

type Installer struct {
	platformClient *platform.Client
	configs        *Configs
	logger         *zap.Logger
}

func New(logger *zap.Logger) *Installer {
	return &Installer{
		platformClient: platform.New(),
		configs:        NewConfigs(path.Join(AppDir, "config"), path.Join(DataDir, "config")),
		logger:         logger,
	}
}

func (i *Installer) Configure() error {
	return i.UpdateConfigs()
}

func (i *Installer) AccessChange() error {
	if err := i.UpdateConfigs(); err != nil {
		return err
	}
	return i.platformClient.RestartService(fmt.Sprintf("%s.%s", App, App))
}

func (i *Installer) RestorePreStart() error {
	return i.UpdateConfigs()
}

func (i *Installer) UpdateConfigs() error {
	if err := linux.CreateUser(App); err != nil {
		return err
	}
	if err := linux.CreateMissingDirs(
		path.Join(DataDir, "nginx"),
		path.Join(DataDir, "uploads"),
	); err != nil {
		return err
	}

	secret, err := i.platformClient.RegisterOIDCClient(App, []string{OIDCRedirect}, true, "client_secret_post")
	if err != nil {
		return fmt.Errorf("oidc register: %w", err)
	}
	authUrl, err := i.platformClient.GetAppUrl("auth")
	if err != nil {
		return err
	}
	appUrl, err := i.platformClient.GetAppUrl(App)
	if err != nil {
		return err
	}

	err = i.configs.Generate(Variables{
		AppDir:       AppDir,
		DataDir:      DataDir,
		CommonDir:    CommonDir,
		AppUrl:       appUrl,
		AuthUrl:      authUrl,
		ClientSecret: secret,
	})
	if err != nil {
		return fmt.Errorf("generate config: %w", err)
	}

	if err := linux.Chown(DataDir, App); err != nil {
		return err
	}
	return linux.Chown(CommonDir, App)
}
